import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { env } from '$env/dynamic/private';
import { cookieName as localeCookieName, getTextDirection, locales } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

const PB_URL = env.PB_URL || 'http://127.0.0.1:8090';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handlePocketbase: Handle = async ({ event, resolve }) => {
	event.locals.pb = new PocketBase(PB_URL);
	// SvelteKit runs parent/child load functions concurrently on the same
	// request-scoped client; the SDK's auto-cancellation would otherwise
	// abort one load's request when another starts.
	event.locals.pb.autoCancellation(false);
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		if (event.locals.pb.authStore.isValid) {
			// Sliding session: every visit swaps the token for a fresh one,
			// so the user only gets logged out after a full token lifetime
			// of *inactivity* (see pb_migrations/0015_alter_users_auth_token_duration.js).
			await event.locals.pb.collection('users').authRefresh();
		}
	} catch (error) {
		// Only drop the session when PocketBase actually rejects the token
		// (expired/invalidated, or the user was deleted). A transient failure
		// — PocketBase restarting during a deploy, a network blip, a timeout —
		// must NOT log the user out: clearing here makes the cookie export
		// below send an already-expired cookie, which deletes the session.
		const status = error instanceof ClientResponseError ? error.status : 0;
		if (status === 401 || status === 403 || status === 404) {
			event.locals.pb.authStore.clear();
		}
	}

	event.locals.user = event.locals.pb.authStore.record;

	// keep the paraglide locale cookie in sync with the user's saved
	// preference (from /account). Takes effect starting with the next
	// request/navigation, since paraglideMiddleware has already resolved
	// the locale for this one by the time locals.user is available here.
	const userLocale = event.locals.user?.locale;
	if (userLocale && locales.includes(userLocale) && event.cookies.get(localeCookieName) !== userLocale) {
		event.cookies.set(localeCookieName, userLocale, { path: '/' });
	}

	const response = await resolve(event);

	response.headers.append(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({
			httpOnly: true,
			secure: !event.url.hostname.includes('localhost'),
			// The SDK defaults to SameSite=Strict, which means the browser
			// doesn't send the cookie when the app is opened from another site
			// (Authentik's app dashboard, a link in a chat/mail app...). The
			// request then looks logged-out, and the cookie export above
			// overwrites the real session with an expired one — a forced
			// logout. Lax still blocks cross-site POSTs (CSRF), which is what
			// matters here.
			sameSite: 'lax'
		})
	);

	return response;
};

export const handle: Handle = sequence(handleParaglide, handlePocketbase);
