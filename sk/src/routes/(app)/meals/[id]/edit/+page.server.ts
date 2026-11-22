import { error, fail, redirect } from '@sveltejs/kit';
import * as m from '$lib/paraglide/messages.js';
import { isPhotoError, parseMealForm } from '$lib/mealForm';
import { MEAL_FIELDS, toMeal } from '$lib/meals';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const meal = await locals.pb.collection('meals').getOne(params.id, { fields: MEAL_FIELDS });
		return { meal: toMeal(meal) };
	} catch {
		error(404, m.meals_not_found());
	}
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const { values, photo, removePhoto, valid } = parseMealForm(await request.formData());

		if (!valid) return fail(400, { message: m.meals_error_invalid(), ...values });

		// a new photo replaces the old one; "remove" without a new one clears it
		const data: Record<string, unknown> = { ...values };
		if (photo) data.photo = photo;
		else if (removePhoto) data.photo = null;

		try {
			await locals.pb.collection('meals').update(params.id, data);
		} catch (err) {
			return fail(400, { message: isPhotoError(err) ? m.meals_error_photo() : m.meals_error_save(), ...values });
		}

		redirect(303, '/meals/library');
	},

	/** Deletes the dish; PocketBase also removes it from the plan (meal_plan.meal cascades). */
	delete: async ({ params, locals }) => {
		try {
			await locals.pb.collection('meals').delete(params.id);
		} catch {
			return fail(400, { message: m.meals_error_delete() });
		}

		redirect(303, '/meals/library');
	}
};
