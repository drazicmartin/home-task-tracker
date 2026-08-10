import type { PageServerLoad } from './$types';

type Window = 'week' | 'month' | 'all';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { activeHousehold } = await parent();
	const window: Window = ['week', 'month', 'all'].includes(url.searchParams.get('window') ?? '')
		? (url.searchParams.get('window') as Window)
		: 'week';

	if (!activeHousehold) {
		return { ranking: [], window };
	}

	const filterParams: Record<string, unknown> = { h: activeHousehold.id };
	let filter = 'household = {:h}';
	if (window !== 'all') {
		const days = window === 'week' ? 7 : 30;
		filterParams.since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
		filter += ' && created >= {:since}';
	}

	const records = await locals.pb.collection('records').getFullList({
		filter: locals.pb.filter(filter, filterParams),
		expand: 'user'
	});

	const totals = new Map<string, { id: string; name: string; total: number }>();
	for (const record of records) {
		const user = record.expand?.user;
		if (!user) continue;
		const entry = totals.get(user.id) ?? { id: user.id, name: user.name || user.email, total: 0 };
		entry.total += record.score;
		totals.set(user.id, entry);
	}

	const ranking = [...totals.values()].sort((a, b) => b.total - a.total);

	return { ranking, window };
};
