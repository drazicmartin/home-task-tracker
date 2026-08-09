import { error, fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	let household;
	try {
		household = await locals.pb.collection('households').getOne(params.id);
	} catch {
		error(404, 'Foyer introuvable');
	}

	const members = await locals.pb.collection('household_members').getFullList({
		filter: locals.pb.filter('household = {:id}', { id: params.id }),
		expand: 'user',
		sort: 'created'
	});

	const invites = await locals.pb.collection('invites').getFullList({
		filter: locals.pb.filter('household = {:id}', { id: params.id }),
		sort: '-created'
	});

	return {
		household,
		isOwner: household.owner === locals.user!.id,
		members: members
			.map((m) => ({ membershipId: m.id, user: m.expand?.user }))
			.filter((m): m is { membershipId: string; user: NonNullable<typeof m.user> } => Boolean(m.user)),
		invites
	};
};

export const actions: Actions = {
	rename: async ({ request, params, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();

		if (!name) {
			return fail(400, { action: 'rename', message: 'Le nom ne peut pas être vide.' });
		}

		try {
			await locals.pb.collection('households').update(params.id, { name });
		} catch {
			return fail(403, { action: 'rename', message: "Impossible de renommer le foyer." });
		}
	},

	createInvite: async ({ params, locals }) => {
		try {
			await locals.pb.collection('invites').create({
				household: params.id,
				code: nanoid(10),
				created_by: locals.user!.id,
				uses_count: 0
			});
		} catch {
			return fail(400, { action: 'createInvite', message: "Impossible de créer l'invitation." });
		}
	},

	revokeInvite: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('inviteId') ?? '');

		try {
			await locals.pb.collection('invites').delete(id);
		} catch {
			return fail(400, { action: 'revokeInvite', message: "Impossible de révoquer l'invitation." });
		}
	},

	removeMember: async ({ request, locals }) => {
		const form = await request.formData();
		const membershipId = String(form.get('membershipId') ?? '');

		try {
			await locals.pb.collection('household_members').delete(membershipId);
		} catch {
			return fail(400, { action: 'removeMember', message: 'Impossible de retirer ce membre.' });
		}
	}
};
