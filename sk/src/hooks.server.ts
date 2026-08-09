import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { getTextDirection } from '$lib/paraglide/runtime';
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
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		if (event.locals.pb.authStore.isValid) {
			await event.locals.pb.collection('users').authRefresh();
		}
	} catch {
		event.locals.pb.authStore.clear();
	}

	event.locals.user = event.locals.pb.authStore.record;

	const response = await resolve(event);

	response.headers.append(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({ httpOnly: true, secure: !event.url.hostname.includes('localhost') })
	);

	return response;
};

export const handle: Handle = sequence(handleParaglide, handlePocketbase);
