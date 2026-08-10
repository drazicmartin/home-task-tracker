import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { activeHousehold } = await parent();
	if (!activeHousehold) {
		return { items: [], page: 1, totalPages: 1 };
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);

	const result = await locals.pb.collection('records').getList(page, 30, {
		filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
		sort: '-created',
		expand: 'user,task'
	});

	return {
		items: result.items,
		page: result.page,
		totalPages: result.totalPages
	};
};
