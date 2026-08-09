import { fail, redirect } from '@sveltejs/kit';
import { getAdminClient } from '$lib/server/pbAdmin';
import type { Actions, PageServerLoad } from './$types';

const ACTIVE_HOUSEHOLD_COOKIE = 'active_household';

export const load: PageServerLoad = async ({ params }) => {
	const pbAdmin = await getAdminClient();

	try {
		const invite = await pbAdmin
			.collection('invites')
			.getFirstListItem(pbAdmin.filter('code = {:code}', { code: params.code }), { expand: 'household' });

		const household = invite.expand?.household;
		if (!household) {
			return { invite: null };
		}

		return {
			invite: {
				householdName: household.name as string,
				expired: Boolean(invite.expires_at && new Date(invite.expires_at) < new Date()),
				exhausted: invite.max_uses > 0 && invite.uses_count >= invite.max_uses
			}
		};
	} catch {
		return { invite: null };
	}
};

export const actions: Actions = {
	redeem: async ({ params, locals, cookies }) => {
		if (!locals.user) {
			redirect(303, `/login?next=${encodeURIComponent(`/invite/${params.code}`)}`);
		}

		const pbAdmin = await getAdminClient();

		let invite;
		try {
			invite = await pbAdmin
				.collection('invites')
				.getFirstListItem(pbAdmin.filter('code = {:code}', { code: params.code }));
		} catch {
			return fail(404, { message: "Cette invitation n'existe pas ou a été révoquée." });
		}

		if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
			return fail(400, { message: 'Cette invitation a expiré.' });
		}
		if (invite.max_uses > 0 && invite.uses_count >= invite.max_uses) {
			return fail(400, { message: "Cette invitation a atteint son nombre maximal d'utilisations." });
		}

		try {
			await pbAdmin.collection('household_members').create({
				household: invite.household,
				user: locals.user.id
			});
			await pbAdmin.collection('invites').update(invite.id, { uses_count: invite.uses_count + 1 });
		} catch {
			// most likely already a member (unique household+user index) — idempotent, just continue
		}

		cookies.set(ACTIVE_HOUSEHOLD_COOKIE, invite.household, { path: '/', maxAge: 60 * 60 * 24 * 365 });
		redirect(303, '/board');
	}
};
