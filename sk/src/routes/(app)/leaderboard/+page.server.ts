import { getHouseholdRecords, getUserTotals, type Window } from '$lib/scoring';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { activeHousehold } = await parent();
	const window: Window = ['week', 'month', 'all'].includes(url.searchParams.get('window') ?? '')
		? (url.searchParams.get('window') as Window)
		: 'week';

	if (!activeHousehold) {
		return { ranking: [], window };
	}

	const records = await getHouseholdRecords(locals.pb, activeHousehold.id, window);
	const ranking = getUserTotals(records);

	return { ranking, window };
};
