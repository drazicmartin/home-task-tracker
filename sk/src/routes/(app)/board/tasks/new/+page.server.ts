import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const frequency = Number(form.get('frequency') ?? 1);
		const unit = String(form.get('unit') ?? 'week');
		const score = Number(form.get('score') ?? 1);

		if (!householdId) {
			return fail(400, { message: 'Aucun foyer actif.', name, description, frequency, unit, score });
		}
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
			await locals.pb.collection('tasks').create({
				household: householdId,
				name,
				description,
				frequency,
				unit,
				score
			});
		} catch {
			return fail(400, {
				message: 'Impossible de créer la tâche, réessayez.',
				name,
				description,
				frequency,
				unit,
				score
			});
		}

		redirect(303, '/board');
	}
};
