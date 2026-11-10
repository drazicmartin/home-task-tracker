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
	update: async ({ request, params, locals }) => {
		const { values, valid } = parseTaskForm(await request.formData());

		if (!valid) {
			return fail(400, { message: 'Merci de vérifier les champs (nom, fréquence, points).', ...values });
		}

		try {
			await locals.pb.collection('tasks').update(params.id, values);
		} catch {
			return fail(400, { message: 'Impossible de modifier la tâche, réessayez.', ...values });
		}

		redirect(303, '/board');
	},

	delete: async ({ params, locals }) => {
		try {
			await locals.pb.collection('tasks').delete(params.id);
		} catch {
			return fail(400, { message: 'Impossible de supprimer la tâche.' });
		}

		redirect(303, '/board');
	}
};
