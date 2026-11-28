import type { Cookies } from '@sveltejs/kit';
import { cookieDomain, cookieMaxAge, cookieName, isLocale } from '$lib/paraglide/runtime';

/**
 * Writes Paraglide's locale cookie from the server (ignores anything that
 * isn't one of the app's locales, e.g. a user who never picked one).
 *
 * It MUST stay readable by client JS: the Paraglide runtime resolves the
 * locale in the browser from `document.cookie`, and SvelteKit's
 * `cookies.set` defaults to httpOnly. An httpOnly copy is invisible there,
 * so after hydration and on every client-side navigation the app falls back
 * to the base locale (fr) even for an English account. Same path and
 * lifetime as the cookie the client runtime's own setLocale() writes; it
 * only ever holds "fr"/"en", nothing sensitive.
 */
export function setLocaleCookie(cookies: Cookies, locale: unknown): void {
	if (!isLocale(locale)) return;

	cookies.set(cookieName, locale, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		maxAge: cookieMaxAge,
		...(cookieDomain ? { domain: cookieDomain } : {})
	});
}
