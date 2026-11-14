import { fail } from '@sveltejs/kit';
import { getOrderedTasksWithScores } from '$lib/scoring';
import { householdKind } from '$lib/householdKinds';
import { buildTimelineEvents, getTimelineRecords, type TimelineRecord } from '$lib/timeline';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { activeHousehold } = await parent();
	if (!activeHousehold) {
		return { tasks: [], members: [], timeline: [] };
	}

	const [tasks, memberships, timelineRecords] = await Promise.all([
		getOrderedTasksWithScores(locals.pb, activeHousehold.id),
		locals.pb.collection('household_members').getFullList({
			filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
			expand: 'user',
			sort: 'created'
		}),
		// the timeline is a nice-to-have: never let it break the board
		getTimelineRecords(locals.pb, activeHousehold.id).catch((): TimelineRecord[] => [])
	]);

	const members = memberships
		.map((m) => m.expand?.user)
		.filter((u): u is NonNullable<typeof u> => Boolean(u));

	const userNames = new Map(members.map((u) => [u.id, u.name || u.email]));
	const timeline = buildTimelineEvents(timelineRecords, tasks, userNames, householdKind(activeHousehold));

	return { tasks, members, timeline };
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
	},

	// "Skip this round": restarts the quest's timer without awarding points.
	task_skip: async ({ request, locals }) => {
		const form = await request.formData();
		const taskId = String(form.get('task_id') ?? '');
		if (!taskId) {
			return fail(400, { success: false, message: 'Quête introuvable.' });
		}

		try {
			const task = await locals.pb.collection('tasks').getOne(taskId, { fields: 'skipped_at' });
			await locals.pb.collection('tasks').update(taskId, { skipped_at: new Date().toISOString() });
			// the previous value lets the client offer an "undo"
			return { success: true, skipped: { taskId, previous: String(task.skipped_at ?? '') } };
		} catch {
			return fail(400, { success: false, message: 'Impossible de passer la quête, réessayez.' });
		}
	},

	// Undo of task_skip: puts back the skipped_at the quest had before.
	task_unskip: async ({ request, locals }) => {
		const form = await request.formData();
		const taskId = String(form.get('task_id') ?? '');
		const previous = String(form.get('previous') ?? '');
		if (!taskId || (previous && Number.isNaN(Date.parse(previous)))) {
			return fail(400, { success: false, message: 'Requête invalide.' });
		}

		try {
			await locals.pb.collection('tasks').update(taskId, { skipped_at: previous });
		} catch {
			return fail(400, { success: false, message: "Impossible d'annuler, réessayez." });
		}
		return { success: true };
	}
};
