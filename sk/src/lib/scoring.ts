import type PocketBase from 'pocketbase';

const DAY_SECONDS = 24 * 60 * 60;

export type Window = 'week' | 'month' | 'all';

/**
 * First UTC day ('YYYY-MM-DD') of a window, or undefined for 'all' (no lower
 * bound). Windows are whole calendar days, today included: 'week' is today
 * and the 6 days before it, 'month' today and the 29 before.
 */
export function windowSinceDay(window: Window): string | undefined {
	if (window === 'all') return undefined;
	const days = window === 'week' ? 7 : 30;
	return new Date(Date.now() - (days - 1) * DAY_SECONDS * 1000).toISOString().slice(0, 10);
}

export type DailyPoints = {
	user: string;
	/** UTC day, 'YYYY-MM-DD' */
	day: string;
	points: number;
	completions: number;
	expand?: { user?: { id: string; name?: string; email?: string } };
};

/**
 * Points and completion counts per member per day for a household, within a
 * window. Summed up by PocketBase (the daily_points view), so this stays a
 * handful of rows no matter how much history the household has.
 */
export async function getDailyPoints(pb: PocketBase, householdId: string, window: Window): Promise<DailyPoints[]> {
	const filterParams: Record<string, unknown> = { h: householdId };
	let filter = 'household = {:h}';
	const since = windowSinceDay(window);
	if (since) {
		filterParams.since = since;
		filter += ' && day >= {:since}';
	}

	const rows = await pb.collection('daily_points').getFullList({
		filter: pb.filter(filter, filterParams),
		fields: 'user,day,points,completions,expand.user.id,expand.user.name,expand.user.email',
		expand: 'user'
	});
	return rows.map((row) => ({
		user: row.user,
		day: row.day,
		points: Number(row.points) || 0,
		completions: Number(row.completions) || 0,
		expand: row.expand
	}));
}

export type UserTotal = { id: string; name: string; total: number };

/** Aggregates daily points into per-user point totals, ranked highest first. */
export function getUserTotals(rows: DailyPoints[]): UserTotal[] {
	const totals = new Map<string, UserTotal>();
	for (const row of rows) {
		const user = row.expand?.user;
		if (!user) continue; // no longer visible (left every shared household)
		const entry = totals.get(user.id) ?? { id: user.id, name: user.name || user.email || '', total: 0 };
		entry.total = Math.round((entry.total + row.points) * 100) / 100;
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
	const byHousehold = { filter: pb.filter('household = {:h}', { h: householdId }) };
	// each quest's latest completion comes from the task_last_done view, in
	// the same round-trip, instead of one request per quest
	const [tasks, lastDone] = await Promise.all([
		pb.collection('tasks').getFullList({ ...byHousehold, sort: 'name' }),
		pb.collection('task_last_done').getFullList({ ...byHousehold, fields: 'id,last_done' })
	]);
	const lastDoneById = new Map(lastDone.map((row) => [row.id, String(row.last_done ?? '')]));

	const withScores = tasks.map((task): TaskWithScore => {
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
			};
		}

		// no completions yet — overdue-ness is measured from task creation
		let since = lastDoneById.get(task.id) || task.created;
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
		};
	});

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
