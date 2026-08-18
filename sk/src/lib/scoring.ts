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
	todoPercentage: number;
};

export async function getOrderedTasksWithScores(pb: PocketBase, householdId: string): Promise<TaskWithScore[]> {
	const tasks = await pb.collection('tasks').getFullList({
		filter: pb.filter('household = {:h}', { h: householdId }),
		sort: 'name'
	});

	const withScores = await Promise.all(
		tasks.map(async (task) => {
			let since = task.created;
			try {
				const lastRecord = await pb
					.collection('records')
					.getFirstListItem(pb.filter('task = {:t}', { t: task.id }), { sort: '-created' });
				since = lastRecord.created;
			} catch {
				// no completions yet — overdue-ness is measured from task creation
			}

			return {
				id: task.id,
				name: task.name,
				description: task.description,
				score: task.score,
				frequency: task.frequency,
				unit: task.unit,
				todoPercentage: getTodoPercentage(task.frequency, task.unit, since)
			} satisfies TaskWithScore;
		})
	);

	return withScores.sort((a, b) => b.todoPercentage - a.todoPercentage);
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
