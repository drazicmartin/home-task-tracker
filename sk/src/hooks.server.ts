import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import PocketBase from 'pocketbase';
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
			await event.locals.pb.collection('users').authRefresh();
		}
	} catch {
		event.locals.pb.authStore.clear();
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
		event.locals.pb.authStore.exportToCookie({ httpOnly: true, secure: !event.url.hostname.includes('localhost') })
	);

	return response;
};

export const handle: Handle = sequence(handleParaglide, handlePocketbase);
