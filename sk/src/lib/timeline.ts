import type PocketBase from 'pocketbase';
import type { HouseholdKind } from '$lib/householdKinds';
import { classifyTask, type TaskCategory } from '$lib/questCategories';

export const TIMELINE_DAYS = 30;

export type TimelineEvent = {
	id: string;
	/** ISO timestamp of the completion */
	at: string;
	taskId: string;
	/** null when the quest was deleted since (records are kept) */
	taskName: string | null;
	category: TaskCategory;
	/** everyone who shared this completion */
	users: string[];
	/** total points awarded for this completion (sum of the split) */
	points: number;
};

/** Completions closer than this, for the same quest, are one shared event (the split creates one record per person). */
const MERGE_WINDOW_MS = 2 * 60 * 1000;

export type TimelineRecord = { id: string; task: string; user: string; score: number; created: string };

/**
 * The raw completions of the last TIMELINE_DAYS days, oldest first. Only the
 * fields the timeline needs and no expand: quest and player names come from
 * the lists the board loads anyway (see buildTimelineEvents), which is a lot
 * cheaper than having PocketBase join them onto every record.
 */
export async function getTimelineRecords(pb: PocketBase, householdId: string): Promise<TimelineRecord[]> {
	const since = new Date(Date.now() - TIMELINE_DAYS * 24 * 60 * 60 * 1000).toISOString();
	const records = await pb.collection('records').getFullList({
		filter: pb.filter('household = {:h} && created >= {:since}', { h: householdId, since }),
		sort: 'created',
		fields: 'id,task,user,score,created'
	});
	return records.map((r) => ({ id: r.id, task: r.task, user: r.user, score: Number(r.score) || 0, created: r.created }));
}

/** One event per (shared) completion, oldest first. */
export function buildTimelineEvents(
	records: TimelineRecord[],
	tasks: { id: string; name: string; description?: string }[],
	userNames: Map<string, string>,
	kind: HouseholdKind
): TimelineEvent[] {
	const tasksById = new Map(tasks.map((t) => [t.id, t]));
	const events: TimelineEvent[] = [];
	const lastByTask = new Map<string, TimelineEvent>();
	for (const record of records) {
		const task = tasksById.get(record.task);
		const userName = userNames.get(record.user) ?? '?';
		const previous = lastByTask.get(record.task);
		if (previous && new Date(record.created).getTime() - new Date(previous.at).getTime() < MERGE_WINDOW_MS) {
			previous.users.push(userName);
			previous.points = Math.round((previous.points + record.score) * 100) / 100;
			continue;
		}
		const event: TimelineEvent = {
			id: record.id,
			at: record.created,
			taskId: record.task,
			taskName: task?.name ?? null,
			category: task ? classifyTask(task.name, task.description ?? '', kind) : 'other',
			users: [userName],
			points: record.score
		};
		events.push(event);
		lastByTask.set(record.task, event);
	}
	return events;
}
