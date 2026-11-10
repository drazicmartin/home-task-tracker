import { error, fail, redirect } from '@sveltejs/kit';
import { parseTaskForm } from '$lib/taskForm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const task = await locals.pb.collection('tasks').getOne(params.id);
		return { task };
	} catch {
		error(404, 'Tâche introuvable');
	}
};

export const actions: Actions = {
	// Creates a new quest from the (possibly edited) copy; the original is untouched.
	create: async ({ request, params, locals }) => {
		const { values, valid } = parseTaskForm(await request.formData());

		if (!valid) {
			return fail(400, { message: 'Merci de vérifier les champs (nom, fréquence, points).', ...values });
		}

		try {
			// keep the copy in the same household as the original quest
			const original = await locals.pb.collection('tasks').getOne(params.id, { fields: 'household' });
			await locals.pb.collection('tasks').create({ household: original.household, ...values });
		} catch {
			return fail(400, { message: 'Impossible de dupliquer la tâche, réessayez.', ...values });
		}

		redirect(303, '/board');
	}
};
