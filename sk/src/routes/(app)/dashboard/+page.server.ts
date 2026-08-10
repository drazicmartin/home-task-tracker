import { getHouseholdRecords, getOrderedTasksWithScores, getUserTotals, type Window } from '$lib/scoring';
import type { PageServerLoad } from './$types';

type TrendPoint = { date: string; count: number };
type Health = { ok: number; dueSoon: number; overdue: number };

const DAY_MS = 24 * 60 * 60 * 1000;

function bucketTrend(records: Awaited<ReturnType<typeof getHouseholdRecords>>, window: Window): TrendPoint[] {
	const bucketMs = window === 'all' ? 7 * DAY_MS : DAY_MS;
	const buckets = new Map<number, number>();
	for (const record of records) {
		const ts = new Date(record.created).getTime();
		const bucketStart = Math.floor(ts / bucketMs) * bucketMs;
		buckets.set(bucketStart, (buckets.get(bucketStart) ?? 0) + 1);
	}
	return [...buckets.entries()]
		.sort(([a], [b]) => a - b)
		.map(([ts, count]) => ({ date: new Date(ts).toISOString(), count }));
}

function bucketHealth(tasks: Awaited<ReturnType<typeof getOrderedTasksWithScores>>): Health {
	const health: Health = { ok: 0, dueSoon: 0, overdue: 0 };
	for (const task of tasks) {
		if (task.todoPercentage > 100) health.overdue += 1;
		else if (task.todoPercentage >= 70) health.dueSoon += 1;
		else health.ok += 1;
	}
	return health;
}

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { activeHousehold } = await parent();
	const window: Window = ['week', 'month', 'all'].includes(url.searchParams.get('window') ?? '')
		? (url.searchParams.get('window') as Window)
		: 'week';

	if (!activeHousehold) {
		return { ranking: [], trend: [], health: { ok: 0, dueSoon: 0, overdue: 0 }, window };
	}

	const records = await getHouseholdRecords(locals.pb, activeHousehold.id, window);
	const ranking = getUserTotals(records);
	const trend = bucketTrend(records, window);

	const tasks = await getOrderedTasksWithScores(locals.pb, activeHousehold.id);
	const health = bucketHealth(tasks);

	return { ranking, trend, health, window };
};
