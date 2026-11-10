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
	// Creates a new quest from the (possibly edited) copy; the original is untouched.
	create: async ({ request, params, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const frequency = Number(form.get('frequency') ?? 1);
		const unit = String(form.get('unit') ?? 'week');
		const score = Number(form.get('score') ?? 1);
		const values = { name, description, frequency, unit, score };

		if (!name || frequency <= 0 || score < 0) {
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
