import { fail } from '@sveltejs/kit';
import { getOrderedTasksWithScores } from '$lib/scoring';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { activeHousehold } = await parent();
	if (!activeHousehold) {
		return { tasks: [], members: [] };
	}

	const [tasks, memberships] = await Promise.all([
		getOrderedTasksWithScores(locals.pb, activeHousehold.id),
		locals.pb.collection('household_members').getFullList({
			filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
			expand: 'user',
			sort: 'created'
		})
	]);

	const members = memberships
		.map((m) => m.expand?.user)
		.filter((u): u is NonNullable<typeof u> => Boolean(u));

	return { tasks, members };
};

export const actions: Actions = {
	task_done: async ({ request, locals, cookies }) => {
		const householdId = cookies.get('active_household');
		const form = await request.formData();
		const taskId = String(form.get('task_id') ?? '');
		const score = parseFloat(String(form.get('score') ?? '0'));
		const userIds = form.getAll('user_ids').map(String);
		const memberNames = form.getAll('user_names').map(String);

		if (!householdId) {
			return fail(400, { success: false, message: 'Aucun foyer actif.' });
		}
		if (userIds.length === 0) {
			return fail(400, { success: false, message: 'Sélectionnez au moins une personne.' });
		}

		const splitScore = Math.round((score / userIds.length) * 100) / 100;

		try {
			await Promise.all(
				userIds.map((userId) =>
					locals.pb.collection('records').create({
						task: taskId,
						user: userId,
						household: householdId,
						score: splitScore
					})
				)
			);
		} catch {
			return fail(400, { success: false, message: "Impossible d'enregistrer, réessayez." });
		}

		return {
			success: true,
			message: `${memberNames.join(', ')} gagne ${splitScore} point${splitScore > 1 ? 's' : ''} !`
		};
	}
};
