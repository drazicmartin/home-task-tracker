import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * The Authentik OAuth2 popup flow runs client-side (it needs `window`), so
 * it ends up with a valid auth token on a *browser* PocketBase client, not
 * on `locals.pb`. This endpoint re-verifies that token server-side (never
 * trust a client-supplied token as-is) and, on success, hooks.server.ts's
 * existing post-resolve cookie export turns it into the same httpOnly
 * session cookie a normal login/signup would set.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { token } = await request.json();

	if (typeof token !== 'string' || !token) {
		return json({ success: false }, { status: 400 });
	}

	locals.pb.authStore.save(token, null);

	try {
		await locals.pb.collection('users').authRefresh();
	} catch {
		locals.pb.authStore.clear();
		return json({ success: false }, { status: 401 });
	}

	return json({ success: true });
};
