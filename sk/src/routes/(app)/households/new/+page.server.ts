import { fail, redirect } from '@sveltejs/kit';
import { DEFAULT_KIND, isHouseholdKind } from '$lib/householdKinds';
import { getAdminClient } from '$lib/server/pbAdmin';
import type { Actions } from './$types';

const ACTIVE_HOUSEHOLD_COOKIE = 'active_household';

export const actions: Actions = {
	create: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const rawKind = form.get('kind');
		const kind = isHouseholdKind(rawKind) ? rawKind : DEFAULT_KIND;

		if (!name) {
			return fail(400, { action: 'create', message: 'Merci de donner un nom à votre foyer.', name, kind });
		}

		const pbAdmin = await getAdminClient();

		const household = await pbAdmin.collection('households').create({
			name,
			kind,
			owner: locals.user!.id
		});

		try {
			await pbAdmin.collection('household_members').create({
				household: household.id,
				user: locals.user!.id
			});
		} catch (error) {
			await pbAdmin.collection('households').delete(household.id).catch(() => {});
			return fail(500, { action: 'create', message: 'Impossible de créer le foyer, réessayez.', name, kind });
		}

		cookies.set(ACTIVE_HOUSEHOLD_COOKIE, household.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
		// straight to this kind's preset catalogue, to fill the new board in a few taps
		redirect(303, '/board/tasks/new');
	},

	join: async ({ request }) => {
		const form = await request.formData();
		const raw = String(form.get('invite') ?? '').trim();

		if (!raw) {
			return fail(400, { action: 'join', message: "Merci de coller un lien ou un code d'invitation." });
		}

		const match = raw.match(/([A-Za-z0-9_-]{6,32})\/?$/);
		const code = match ? match[1] : raw;

		redirect(303, `/invite/${encodeURIComponent(code)}`);
	}
};
