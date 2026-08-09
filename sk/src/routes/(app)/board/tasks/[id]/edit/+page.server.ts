import { error, fail, redirect } from '@sveltejs/kit';
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
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const frequency = Number(form.get('frequency') ?? 1);
		const unit = String(form.get('unit') ?? 'week');
		const score = Number(form.get('score') ?? 1);

		if (!name || frequency <= 0 || score < 0) {
			return fail(400, {
				message: 'Merci de vérifier les champs (nom, fréquence, points).',
				name,
				description,
				frequency,
				unit,
				score
			});
		}

		try {
			await locals.pb.collection('tasks').update(params.id, { name, description, frequency, unit, score });
		} catch {
			return fail(400, {
				message: 'Impossible de modifier la tâche, réessayez.',
				name,
				description,
				frequency,
				unit,
				score
			});
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
