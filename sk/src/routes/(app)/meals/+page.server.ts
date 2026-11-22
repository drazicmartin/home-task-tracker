import { fail } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import * as m from '$lib/paraglide/messages.js';
import {
	addDays,
	householdMealSlots,
	isDayString,
	isMealSlot,
	MEAL_FIELDS,
	parseMealSlotsForm,
	today,
	toMeal,
	weekStart,
	type MealSlot,
	type PlannedMeal
} from '$lib/meals';
import { setPlannedMeal } from '$lib/server/mealPlan';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { activeHousehold } = await parent();
	const todayDay = today();
	const requested = url.searchParams.get('week');
	const week = weekStart(isDayString(requested) ? requested : todayDay);
	const slots = householdMealSlots(activeHousehold);

	if (!activeHousehold) {
		return { meals: [], plan: [] as PlannedMeal[], week, today: todayDay, slots, isOwner: false };
	}

	const [meals, plan] = await Promise.all([
		locals.pb.collection('meals').getFullList({
			filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
			fields: MEAL_FIELDS
		}),
		locals.pb.collection('meal_plan').getFullList({
			filter: locals.pb.filter('household = {:h} && day >= {:from} && day <= {:to}', {
				h: activeHousehold.id,
				from: week,
				to: addDays(week, 6)
			}),
			fields: 'id,day,slot,meal'
		})
	]);

	const locale = getLocale();
	return {
		meals: meals.map(toMeal).sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' })),
		plan: plan.map((p) => ({ id: p.id, day: String(p.day), slot: p.slot as MealSlot, meal: String(p.meal) })),
		week,
		today: todayDay,
		slots,
		isOwner: activeHousehold.owner === locals.user!.id
	};
};

export const actions: Actions = {
	/** Puts a dish on the menu for one day's lunch or dinner (replacing the previous one). */
	assign: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		const form = await request.formData();
		const day = form.get('day');
		const slot = form.get('slot');
		const mealId = String(form.get('meal') ?? '');

		if (!householdId) return fail(400, { message: m.meals_error_no_household() });
		if (!isDayString(day) || !isMealSlot(slot) || !mealId) {
			return fail(400, { message: m.meals_error_assign() });
		}

		try {
			await setPlannedMeal(locals.pb, householdId, day, slot, mealId);
		} catch {
			return fail(400, { message: m.meals_error_assign() });
		}
		return { assigned: { day, slot, meal: mealId } };
	},

	/** Empties one day's lunch or dinner. */
	clear: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		const form = await request.formData();
		const day = form.get('day');
		const slot = form.get('slot');

		if (!householdId) return fail(400, { message: m.meals_error_no_household() });
		if (!isDayString(day) || !isMealSlot(slot)) return fail(400, { message: m.meals_error_assign() });

		try {
			const rows = await locals.pb.collection('meal_plan').getFullList({
				filter: locals.pb.filter('household = {:h} && day = {:d} && slot = {:s}', { h: householdId, d: day, s: slot }),
				fields: 'id'
			});
			for (const row of rows) await locals.pb.collection('meal_plan').delete(row.id);
		} catch {
			return fail(400, { message: m.meals_error_assign() });
		}
		return { cleared: { day, slot } };
	},

	/** Which meals are planned on each weekday. Owner only (households update rule). */
	saveSlots: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		if (!householdId) return fail(400, { message: m.meals_error_no_household() });

		const slots = parseMealSlotsForm(await request.formData());
		try {
			await locals.pb.collection('households').update(householdId, { meal_slots: slots });
		} catch {
			return fail(403, { message: m.meals_error_settings() });
		}
		return { slotsSaved: true };
	}
};
