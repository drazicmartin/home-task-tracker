import type PocketBase from 'pocketbase';
import type { HouseholdKind } from '$lib/householdKinds';
import { classifyTask, TASK_CATEGORIES, type TaskCategory } from '$lib/questCategories';
import { windowSinceDay, type Window } from '$lib/scoring';

/** How many times a member completed a quest within a window. */
export type UserTaskCount = { user: string; task: string; completions: number };

/**
 * Completions per (member, quest) for a household within a window. All time
 * comes pre-counted from the user_task_completions view; the week / month
 * windows only fetch the two ids of each record in them.
 */
export async function getUserTaskCounts(pb: PocketBase, householdId: string, window: Window): Promise<UserTaskCount[]> {
	const since = windowSinceDay(window);
	if (!since) {
		const rows = await pb.collection('user_task_completions').getFullList({
			filter: pb.filter('household = {:h}', { h: householdId }),
			fields: 'user,task,completions'
		});
		return rows.map((r) => ({ user: r.user, task: r.task, completions: Number(r.completions) || 0 }));
	}

	// same lower bound (a UTC day) as the daily_points rows the rest of the page
	// uses: "2026-01-05 08:00:00.000Z" >= "2026-01-05"
	const records = await pb.collection('records').getFullList({
		filter: pb.filter('household = {:h} && created >= {:since}', { h: householdId, since }),
		fields: 'user,task',
		batch: 1000
	});
	const counts = new Map<string, UserTaskCount>();
	for (const r of records) {
		const key = `${r.user}:${r.task}`;
		const entry = counts.get(key) ?? { user: r.user, task: r.task, completions: 0 };
		entry.completions += 1;
		counts.set(key, entry);
	}
	return [...counts.values()];
}

export type CategoryCount = { category: TaskCategory; count: number };

export type MemberCategoryStats = {
	id: string;
	name: string;
	total: number;
	/** the member's own mix, most done first */
	categories: CategoryCount[];
	/** categories this member does more than anyone else: their count, the household's total and their share of it (0-1) */
	leads: (CategoryCount & { total: number; share: number })[];
};

export type CategoryBreakdown = {
	category: TaskCategory;
	total: number;
	/** who did it, most first */
	members: { id: string; name: string; count: number }[];
	/** sole top contributor, null on a tie */
	leader: string | null;
};

export type CategoryStats = { members: MemberCategoryStats[]; categories: CategoryBreakdown[] };

/**
 * Who does which kind of quest. Quests are sorted into the same categories as
 * the board timeline (classifyTask); completions of deleted quests count as
 * "other". A shared completion counts once for each person who took part.
 */
export function buildCategoryStats(
	counts: UserTaskCount[],
	tasks: { id: string; name: string; description?: string }[],
	users: { id: string; name: string }[],
	kind: HouseholdKind
): CategoryStats {
	const categoryOf = new Map(tasks.map((t) => [t.id, classifyTask(t.name, t.description ?? '', kind)]));
	const names = new Map(users.map((u) => [u.id, u.name]));

	// user -> category -> count
	const perUser = new Map<string, Map<TaskCategory, number>>();
	for (const { user, task, completions } of counts) {
		if (!names.has(user) || completions <= 0) continue; // no longer visible
		const category = categoryOf.get(task) ?? 'other';
		const mine = perUser.get(user) ?? new Map<TaskCategory, number>();
		mine.set(category, (mine.get(category) ?? 0) + completions);
		perUser.set(user, mine);
	}

	const order = (category: TaskCategory) => TASK_CATEGORIES.indexOf(category);

	const categories: CategoryBreakdown[] = TASK_CATEGORIES.map((category) => {
		const members = [...perUser.entries()]
			.map(([id, mine]) => ({ id, name: names.get(id)!, count: mine.get(category) ?? 0 }))
			.filter((m) => m.count > 0)
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
		const total = members.reduce((sum, m) => sum + m.count, 0);
		const leader = members.length > 0 && members[0].count > (members[1]?.count ?? 0) ? members[0].id : null;
		return { category, total, members, leader };
	})
		.filter((c) => c.total > 0)
		.sort((a, b) => b.total - a.total || order(a.category) - order(b.category));

	const members: MemberCategoryStats[] = [...perUser.entries()]
		.map(([id, mine]) => {
			const own = [...mine.entries()]
				.map(([category, count]) => ({ category, count }))
				.sort((a, b) => b.count - a.count || order(a.category) - order(b.category));
			const leads = categories
				.filter((c) => c.leader === id)
				.map((c) => {
					const count = mine.get(c.category) ?? 0;
					return { category: c.category, count, total: c.total, share: count / c.total };
				})
				.sort((a, b) => b.share - a.share || b.count - a.count);
			return {
				id,
				name: names.get(id)!,
				total: own.reduce((sum, c) => sum + c.count, 0),
				categories: own,
				leads
			};
		})
		.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

	return { members, categories };
}
