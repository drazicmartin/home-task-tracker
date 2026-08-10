import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

/**
 * A PocketBase client for the browser only — used for the Authentik OAuth2
 * popup flow (`authWithOAuth2`), which needs `window` and therefore can't
 * run through the normal server-side `locals.pb`. Talks to the *public*
 * PocketBase URL, not the internal Docker one.
 */
export function createBrowserPb(): PocketBase {
	return new PocketBase(env.PUBLIC_PB_URL);
}
