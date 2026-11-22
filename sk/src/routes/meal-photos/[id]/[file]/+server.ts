import { error } from '@sveltejs/kit';
import { ClientResponseError } from 'pocketbase';
import { ALLOWED_PHOTO_THUMBS } from '$lib/meals';
import type { RequestHandler } from './$types';

// PocketBase record ids, and the file names it generates ("photo_a1b2c3d4e5.jpg")
const RECORD_ID = /^[a-z0-9]{15}$/;
const FILE_NAME = /^[\w.-]{1,200}$/;

/**
 * Streams a meal photo from PocketBase to the browser. The "photo" field is
 * protected (pb_migrations/0018), so PocketBase only hands it over with a
 * file token of someone allowed to view the meal, i.e. a member of its
 * household; going through the app also means PocketBase doesn't need to be
 * publicly reachable. File names change on every upload, so a photo URL can
 * be cached for a while — privately, never by shared proxies.
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	// layout loads don't guard +server endpoints
	if (!locals.user) error(401, 'Non connecté');
	if (!RECORD_ID.test(params.id) || !FILE_NAME.test(params.file)) error(404, 'Photo introuvable');

	const thumb = url.searchParams.get('thumb');
	let token: string;
	try {
		token = await locals.pb.files.getToken();
	} catch (err) {
		error(err instanceof ClientResponseError && err.status === 401 ? 401 : 502, 'Photo indisponible');
	}

	const source = locals.pb.files.getURL({ collectionName: 'meals', id: params.id }, params.file, {
		token,
		...(thumb && ALLOWED_PHOTO_THUMBS.has(thumb) ? { thumb } : {})
	});

	let response: Response;
	try {
		response = await fetch(source);
	} catch {
		error(502, 'Photo indisponible');
	}
	if (!response.ok || !response.body) {
		error(response.status === 404 || response.status === 403 ? 404 : 502, 'Photo introuvable');
	}

	return new Response(response.body, {
		headers: {
			'content-type': response.headers.get('content-type') ?? 'application/octet-stream',
			'cache-control': 'private, max-age=604800',
			'x-content-type-options': 'nosniff'
		}
	});
};
