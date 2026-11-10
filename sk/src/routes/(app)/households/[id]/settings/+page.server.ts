import { error, fail, redirect, type Cookies } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { isHouseholdKind } from '$lib/householdKinds';
import { getAdminClient } from '$lib/server/pbAdmin';
import type { Actions, PageServerLoad } from './$types';

const ACTIVE_HOUSEHOLD_COOKIE = 'active_household';

/** After leaving/deleting a household, send the user to another one (or to the create/join screen). */
function exitHousehold(cookies: Cookies, householdId: string): never {
	if (cookies.get(ACTIVE_HOUSEHOLD_COOKIE) === householdId) {
		cookies.delete(ACTIVE_HOUSEHOLD_COOKIE, { path: '/' });
	}
	redirect(303, '/board');
}

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

	changeKind: async ({ request, params, locals }) => {
		const kind = (await request.formData()).get('kind');

		if (!isHouseholdKind(kind)) {
			return fail(400, { action: 'changeKind', message: 'Type de foyer inconnu.' });
		}

		try {
			await locals.pb.collection('households').update(params.id, { kind });
		} catch {
			return fail(403, { action: 'changeKind', message: 'Impossible de changer le type du foyer.' });
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

	removeMember: async ({ request, params, locals, cookies }) => {
		const form = await request.formData();
		const membershipId = String(form.get('membershipId') ?? '');

		let membership;
		try {
			membership = await locals.pb.collection('household_members').getOne(membershipId);
			await locals.pb.collection('household_members').delete(membershipId);
		} catch {
			return fail(400, { action: 'removeMember', message: 'Impossible de retirer ce membre.' });
		}

		// removing yourself = leaving: this settings page is no longer viewable
		if (membership.user === locals.user!.id) exitHousehold(cookies, params.id);
	},

	/**
	 * Leave the household. A regular member just drops their membership; the
	 * owner hands ownership over to the longest-standing other member first
	 * (done with the superuser client, since nobody may set households.owner
	 * to someone else through the API rules). An owner who is alone has to
	 * delete the household instead.
	 */
	leave: async ({ params, locals, cookies }) => {
		const userId = locals.user!.id;

		let household;
		let members;
		try {
			household = await locals.pb.collection('households').getOne(params.id);
			members = await locals.pb.collection('household_members').getFullList({
				filter: locals.pb.filter('household = {:h}', { h: params.id }),
				sort: 'created'
			});
		} catch {
			return fail(404, { action: 'leave', message: 'Foyer introuvable.' });
		}

		const mine = members.find((m) => m.user === userId);
		if (!mine) return fail(400, { action: 'leave', message: "Vous n'êtes pas membre de ce foyer." });

		try {
			if (household.owner === userId) {
				const successor = members.find((m) => m.user !== userId);
				if (!successor) {
					return fail(400, {
						action: 'leave',
						message: 'Vous êtes seul dans ce foyer : supprimez-le plutôt que de le quitter.'
					});
				}
				const admin = await getAdminClient();
				await admin.collection('households').update(params.id, { owner: successor.user });
				await admin.collection('household_members').delete(mine.id);
			} else {
				await locals.pb.collection('household_members').delete(mine.id);
			}
		} catch {
			return fail(400, { action: 'leave', message: 'Impossible de quitter le foyer, réessayez.' });
		}

		exitHousehold(cookies, params.id);
	},

	/**
	 * Permanently delete the household with all its quests, history, members
	 * and invites. Owner only. History records are deleted explicitly before
	 * the household: records.task is a required, non-cascading relation, so
	 * letting the household cascade remove tasks first could be refused.
	 */
	deleteHousehold: async ({ request, params, locals, cookies }) => {
		const form = await request.formData();

		let household;
		try {
			household = await locals.pb.collection('households').getOne(params.id);
		} catch {
			return fail(404, { action: 'deleteHousehold', message: 'Foyer introuvable.' });
		}
		if (household.owner !== locals.user!.id) {
			return fail(403, { action: 'deleteHousehold', message: 'Seul le propriétaire peut supprimer le foyer.' });
		}
		if (String(form.get('confirmName') ?? '').trim() !== household.name.trim()) {
			return fail(400, {
				action: 'deleteHousehold',
				message: 'Le nom saisi ne correspond pas au nom du foyer.'
			});
		}

		try {
			const admin = await getAdminClient();
			const byHousehold = admin.filter('household = {:h}', { h: params.id });
			for (const collection of ['records', 'tasks', 'invites', 'household_members']) {
				const rows = await admin.collection(collection).getFullList({ filter: byHousehold, fields: 'id' });
				for (const row of rows) await admin.collection(collection).delete(row.id);
			}
			await admin.collection('households').delete(params.id);
		} catch {
			return fail(400, { action: 'deleteHousehold', message: 'Impossible de supprimer le foyer, réessayez.' });
		}

		exitHousehold(cookies, params.id);
	}
};
