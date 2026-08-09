import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ACTIVE_HOUSEHOLD_COOKIE = 'active_household';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const form = await request.formData();
	const householdId = String(form.get('householdId') ?? '');

	const membership = await locals.pb
		.collection('household_members')
		.getFirstListItem(locals.pb.filter('household = {:h} && user = {:u}', { h: householdId, u: locals.user!.id }))
		.catch(() => null);

	if (membership) {
		cookies.set(ACTIVE_HOUSEHOLD_COOKIE, householdId, { path: '/', maxAge: 60 * 60 * 24 * 365 });
	}

	redirect(303, '/board');
};
