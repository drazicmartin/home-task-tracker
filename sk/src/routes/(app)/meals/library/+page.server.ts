import { getLocale } from '$lib/paraglide/runtime';
import { MEAL_FIELDS, toMeal } from '$lib/meals';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { activeHousehold } = await parent();
	if (!activeHousehold) return { meals: [] };

	const meals = await locals.pb.collection('meals').getFullList({
		filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
		fields: MEAL_FIELDS
	});

	const locale = getLocale();
	return {
		meals: meals.map(toMeal).sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }))
	};
};
