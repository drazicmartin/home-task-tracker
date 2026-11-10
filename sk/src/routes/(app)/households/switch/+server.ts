import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ACTIVE_HOUSEHOLD_COOKIE = 'active_household';

/** Only same-site paths, so "next" can't be used as an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
	const next = String(value ?? '');
	return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/board';
}

/**
 * Make another household (one the user belongs to) the active one. Answers
 * JSON to the household switcher's fetch (which then navigates client-side),
 * and redirects to `next` for a plain form post without JavaScript.
 */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	// layout loads don't guard +server endpoints
	if (!locals.user) redirect(303, '/login');

	const form = await request.formData();
	const householdId = String(form.get('householdId') ?? '');
	const next = safeNext(form.get('next'));

	const membership = await locals.pb
		.collection('household_members')
		.getFirstListItem(locals.pb.filter('household = {:h} && user = {:u}', { h: householdId, u: locals.user!.id }))
		.catch(() => null);

	if (membership) {
		cookies.set(ACTIVE_HOUSEHOLD_COOKIE, householdId, { path: '/', maxAge: 60 * 60 * 24 * 365 });
	}

	if (request.headers.get('accept')?.includes('application/json')) {
		return json({ ok: Boolean(membership) }, { status: membership ? 200 : 403 });
	}
	redirect(303, membership ? next : '/board');
};
