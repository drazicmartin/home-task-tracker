import { fail, redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { parseTaskForm } from '$lib/taskForm';
import { findCatalogQuest, localize, questScore } from '$lib/questCatalog';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const householdId = cookies.get('active_household');
	if (!householdId) return { existingNames: [] as string[] };

	// used to grey out catalogue entries the household already has
	const tasks = await locals.pb
		.collection('tasks')
		.getFullList({ filter: locals.pb.filter('household = {:h}', { h: householdId }), fields: 'name' })
		.catch(() => []);

	return { existingNames: tasks.map((t) => String(t.name).trim().toLowerCase()) };
};

export const actions: Actions = {
	catalog: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		const form = await request.formData();
		const quests = [...new Set(form.getAll('quest').map(String))]
			.map(findCatalogQuest)
			.filter((q): q is NonNullable<typeof q> => Boolean(q));

		if (!householdId) {
			return fail(400, { catalogMessage: 'Aucun foyer actif.' });
		}
		if (quests.length === 0) {
			return fail(400, { catalogMessage: 'Sélectionnez au moins une quête.' });
		}

		const locale = getLocale();
		try {
			for (const quest of quests) {
				await locals.pb.collection('tasks').create({
					household: householdId,
					name: localize(quest.name, locale),
					description: localize(quest.description, locale),
					frequency: quest.frequency,
					unit: quest.unit,
					score: questScore(quest)
				});
			}
		} catch {
			return fail(400, { catalogMessage: 'Impossible de créer certaines quêtes, réessayez.' });
		}

		redirect(303, '/board');
	},

	create: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		const { values, valid } = parseTaskForm(await request.formData());

		if (!householdId) {
			return fail(400, { message: 'Aucun foyer actif.', ...values });
		}
		if (!valid) {
			return fail(400, { message: 'Merci de vérifier les champs (nom, fréquence, points).', ...values });
		}

		try {
			await locals.pb.collection('tasks').create({ household: householdId, ...values });
		} catch {
			return fail(400, { message: 'Impossible de créer la tâche, réessayez.', ...values });
		}

		redirect(303, '/board');
	}
};
