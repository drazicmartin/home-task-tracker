import type PocketBase from 'pocketbase';

const DAY_SECONDS = 24 * 60 * 60;

export type Window = 'week' | 'month' | 'all';

/** ISO timestamp for the start of a window, or undefined for 'all' (no lower bound). */
export function windowSince(window: Window): string | undefined {
	if (window === 'all') return undefined;
	const days = window === 'week' ? 7 : 30;
	return new Date(Date.now() - days * DAY_SECONDS * 1000).toISOString();
}

/** Fetches the records for a household within a time window, with the completing user expanded. */
export async function getHouseholdRecords(pb: PocketBase, householdId: string, window: Window) {
	const filterParams: Record<string, unknown> = { h: householdId };
	let filter = 'household = {:h}';
	const since = windowSince(window);
	if (since) {
		filterParams.since = since;
		filter += ' && created >= {:since}';
	}

	return pb.collection('records').getFullList({
		filter: pb.filter(filter, filterParams),
		expand: 'user'
	});
}

export type UserTotal = { id: string; name: string; total: number };

/** Aggregates records into per-user point totals, ranked highest first. */
export function getUserTotals(records: Awaited<ReturnType<typeof getHouseholdRecords>>): UserTotal[] {
	const totals = new Map<string, UserTotal>();
	for (const record of records) {
		const user = record.expand?.user;
		if (!user) continue;
		const entry = totals.get(user.id) ?? { id: user.id, name: user.name || user.email, total: 0 };
		entry.total += record.score;
		totals.set(user.id, entry);
	}
	return [...totals.values()].sort((a, b) => b.total - a.total);
}

export function unitToSeconds(unit: string): number {
	switch (unit) {
		case 'year':
			return 365 * DAY_SECONDS;
		case 'month':
			return (365 / 12) * DAY_SECONDS;
		case 'week':
			return 7 * DAY_SECONDS;
		case 'day':
		default:
			return DAY_SECONDS;
	}
}

/** How overdue a task is, as a percentage of its recurrence period (0 = just done, 100 = due, >100 = overdue). */
export function getTodoPercentage(frequency: number, unit: string, sinceIso: string): number {
	const periodSeconds = unitToSeconds(unit) / frequency;
	const sinceTs = new Date(sinceIso).getTime() / 1000;
	const nowTs = Date.now() / 1000;
	return ((nowTs - sinceTs) / periodSeconds) * 100;
}

export type TaskWithScore = {
	id: string;
	name: string;
	description: string;
	score: number;
	frequency: number;
	unit: string;
	/** no recurrence: never due or overdue, always listed after recurring quests */
	onDemand: boolean;
	/** always 0 for on-demand quests */
	todoPercentage: number;
	/** the timer was last restarted by "skip this round" rather than a completion */
	skipped: boolean;
	/** raw tasks.skipped_at ('' when never skipped), so a skip can be undone */
	skippedAt: string;
};

export async function getOrderedTasksWithScores(pb: PocketBase, householdId: string): Promise<TaskWithScore[]> {
	const tasks = await pb.collection('tasks').getFullList({
		filter: pb.filter('household = {:h}', { h: householdId }),
		sort: 'name'
	});

	const withScores = await Promise.all(
		tasks.map(async (task) => {
			if (task.on_demand) {
				return {
					id: task.id,
					name: task.name,
					description: task.description,
					score: task.score,
					frequency: task.frequency,
					unit: task.unit,
					onDemand: true,
					todoPercentage: 0,
					skipped: false,
					skippedAt: task.skipped_at ?? ''
				} satisfies TaskWithScore;
			}

			let since = task.created;
			try {
				const lastRecord = await pb
					.collection('records')
					.getFirstListItem(pb.filter('task = {:t}', { t: task.id }), { sort: '-created' });
				since = lastRecord.created;
			} catch {
				// no completions yet — overdue-ness is measured from task creation
			}
			// "skip this round" restarts the timer without a completion
			const skipped = Boolean(task.skipped_at) && Date.parse(task.skipped_at) > Date.parse(since);
			if (skipped) since = task.skipped_at;

			return {
				id: task.id,
				name: task.name,
				description: task.description,
				score: task.score,
				frequency: task.frequency,
				unit: task.unit,
				onDemand: false,
				todoPercentage: getTodoPercentage(task.frequency, task.unit, since),
				skipped,
				skippedAt: task.skipped_at ?? ''
			} satisfies TaskWithScore;
		})
	);

	return withScores.sort(
		(a, b) => Number(a.onDemand) - Number(b.onDemand) || b.todoPercentage - a.todoPercentage
	);
}

export type QuestStatus = 'ok' | 'dueSoon' | 'overdue';

/** Buckets a task's overdue-ness into the three states shown on the board and dashboard. */
export function questStatus(todoPercentage: number): QuestStatus {
	if (todoPercentage > 100) return 'overdue';
	if (todoPercentage >= 70) return 'dueSoon';
	return 'ok';
}

/** Interpolated green -> amber -> red hue for how overdue a task is. */
export function urgencyHue(todoPercentage: number): number {
	const clamped = Math.min(100, Math.max(0, todoPercentage));
	return 140 - (140 * clamped) / 100;
}

export function urgencyGradient(todoPercentage: number): string {
	const hue = urgencyHue(todoPercentage);
	return `linear-gradient(135deg, hsl(${hue} 62% 38%), hsl(${hue} 70% 48%))`;
}
