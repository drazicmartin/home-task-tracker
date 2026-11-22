import { fail, redirect } from '@sveltejs/kit';
import * as m from '$lib/paraglide/messages.js';
import { isPhotoError, parseMealForm } from '$lib/mealForm';
import { isDayString, isMealSlot, weekStart } from '$lib/meals';
import { setPlannedMeal } from '$lib/server/mealPlan';
import type { Actions, PageServerLoad } from './$types';

/**
 * New dish. Opened from the planner's picker with ?day=&slot= (and the
 * searched ?name=), the dish is put on the menu for that slot right away and
 * the user lands back on the planner; otherwise back to the dish library.
 */
export const load: PageServerLoad = ({ url }) => {
	const day = url.searchParams.get('day');
	const slot = url.searchParams.get('slot');
	return {
		planFor: isDayString(day) && isMealSlot(slot) ? { day, slot } : null,
		name: (url.searchParams.get('name') ?? '').trim().slice(0, 150)
	};
};

export const actions: Actions = {
	create: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		const form = await request.formData();
		const { values, photo, valid } = parseMealForm(form);
		const day = form.get('day');
		const slot = form.get('slot');

		if (!householdId) return fail(400, { message: m.meals_error_no_household(), ...values });
		if (!valid) return fail(400, { message: m.meals_error_invalid(), ...values });

		let mealId: string;
		try {
			const meal = await locals.pb
				.collection('meals')
				.create({ household: householdId, ...values, ...(photo ? { photo } : {}) });
			mealId = meal.id;
		} catch (err) {
			return fail(400, { message: isPhotoError(err) ? m.meals_error_photo() : m.meals_error_save(), ...values });
		}

		if (isDayString(day) && isMealSlot(slot)) {
			try {
				await setPlannedMeal(locals.pb, householdId, day, slot, mealId);
			} catch {
				// the dish exists anyway: it can still be picked from the planner
			}
			redirect(303, `/meals?week=${weekStart(day)}`);
		}
		redirect(303, '/meals/library');
	}
};
