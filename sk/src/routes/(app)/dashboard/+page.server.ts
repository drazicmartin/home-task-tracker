import { getDailyPoints, getOrderedTasksWithScores, getUserTotals, questStatus, type DailyPoints, type Window } from '$lib/scoring';
import { buildCategoryStats, getUserTaskCounts, type CategoryStats, type UserTaskCount } from '$lib/categoryStats';
import { householdKind } from '$lib/householdKinds';
import type { PageServerLoad } from './$types';

type TrendPoint = { date: string; count: number };
type Health = { ok: number; dueSoon: number; overdue: number };

const DAY_MS = 24 * 60 * 60 * 1000;

function bucketTrend(rows: DailyPoints[], window: Window): TrendPoint[] {
	const bucketMs = window === 'all' ? 7 * DAY_MS : DAY_MS;
	const buckets = new Map<number, number>();
	for (const row of rows) {
		const ts = Date.parse(`${row.day}T00:00:00Z`);
		const bucketStart = Math.floor(ts / bucketMs) * bucketMs;
		buckets.set(bucketStart, (buckets.get(bucketStart) ?? 0) + row.completions);
	}
	return [...buckets.entries()]
		.sort(([a], [b]) => a - b)
		.map(([ts, count]) => ({ date: new Date(ts).toISOString(), count }));
}

function bucketHealth(tasks: Awaited<ReturnType<typeof getOrderedTasksWithScores>>): Health {
	const health: Health = { ok: 0, dueSoon: 0, overdue: 0 };
	for (const task of tasks) {
		if (task.onDemand) continue; // no due date, so no health to report
		health[questStatus(task.todoPercentage)] += 1;
	}
	return health;
}

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { activeHousehold } = await parent();
	const window: Window = ['week', 'month', 'all'].includes(url.searchParams.get('window') ?? '')
		? (url.searchParams.get('window') as Window)
		: 'week';

	if (!activeHousehold) {
		const categories: CategoryStats = { members: [], categories: [] };
		return { ranking: [], trend: [], health: { ok: 0, dueSoon: 0, overdue: 0 }, categories, window };
	}

	const [daily, tasks, taskCounts] = await Promise.all([
		getDailyPoints(locals.pb, activeHousehold.id, window),
		getOrderedTasksWithScores(locals.pb, activeHousehold.id),
		// a nice-to-have: never let it break the rest of the page
		getUserTaskCounts(locals.pb, activeHousehold.id, window).catch((): UserTaskCount[] => [])
	]);

	const ranking = getUserTotals(daily);
	const categories = buildCategoryStats(taskCounts, tasks, ranking, householdKind(activeHousehold));

	return { ranking, trend: bucketTrend(daily, window), health: bucketHealth(tasks), categories, window };
};
