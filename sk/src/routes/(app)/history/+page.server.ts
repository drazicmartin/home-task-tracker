import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { activeHousehold } = await parent();
	if (!activeHousehold) {
		return { items: [], page: 1, totalPages: 1, tasks: [], members: [] };
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);

	const [result, tasks, memberships] = await Promise.all([
		locals.pb.collection('records').getList(page, 30, {
			filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
			sort: '-created',
			expand: 'user,task'
		}),
		locals.pb.collection('tasks').getFullList({
			filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
			sort: 'name'
		}),
		locals.pb.collection('household_members').getFullList({
			filter: locals.pb.filter('household = {:h}', { h: activeHousehold.id }),
			expand: 'user',
			sort: 'created'
		})
	]);

	const members = memberships
		.map((m) => m.expand?.user)
		.filter((u): u is NonNullable<typeof u> => Boolean(u));

	return {
		items: result.items,
		page: result.page,
		totalPages: result.totalPages,
		tasks: tasks.map((t) => ({ id: t.id, name: t.name })),
		members: members.map((u) => ({ id: u.id, name: u.name || u.email }))
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		const form = await request.formData();
		const recordId = String(form.get('recordId') ?? '');
		const taskId = String(form.get('task') ?? '');
		const userId = String(form.get('user') ?? '');
		const score = Number(form.get('score') ?? NaN);

		if (!taskId || !userId || Number.isNaN(score) || score < 0) {
			return fail(400, { action: 'update', recordId, message: 'Merci de vérifier les champs.' });
		}

		try {
			await locals.pb.collection('records').update(recordId, { task: taskId, user: userId, score });
		} catch {
			return fail(400, { action: 'update', recordId, message: "Impossible de modifier cette entrée." });
		}

		return { action: 'update', recordId, success: true };
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const recordId = String(form.get('recordId') ?? '');

		try {
			await locals.pb.collection('records').delete(recordId);
		} catch {
			return fail(400, { action: 'delete', recordId, message: 'Impossible de supprimer cette entrée.' });
		}

		return { action: 'delete', recordId, success: true };
	}
};
