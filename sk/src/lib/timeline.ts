import type PocketBase from 'pocketbase';
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

/** Completions of the last TIMELINE_DAYS days, oldest first, one event per (shared) completion. */
export async function getTimelineEvents(pb: PocketBase, householdId: string): Promise<TimelineEvent[]> {
	const since = new Date(Date.now() - TIMELINE_DAYS * 24 * 60 * 60 * 1000).toISOString();
	const records = await pb.collection('records').getFullList({
		filter: pb.filter('household = {:h} && created >= {:since}', { h: householdId, since }),
		sort: 'created',
		expand: 'task,user'
	});

	const events: TimelineEvent[] = [];
	const lastByTask = new Map<string, TimelineEvent>();
	for (const record of records) {
		const task = record.expand?.task;
		const user = record.expand?.user;
		const userName = user ? user.name || user.email : '?';
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
			category: task ? classifyTask(task.name, task.description ?? '') : 'other',
			users: [userName],
			points: record.score
		};
		events.push(event);
		lastByTask.set(record.task, event);
	}
	return events;
}
