/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

/**
 * Service worker that makes HTT installable and gives it a friendly offline
 * screen. SvelteKit builds and registers it automatically.
 *
 * Only the app shell is cached: the built JS/CSS (`build`) and the files in
 * `static/` (`files`). Pages are server-rendered per user and household, so
 * they always go to the network and are never cached — that keeps one
 * person's data from being served to another on a shared device, and keeps
 * the board from showing stale quests. If a page load fails because the
 * device is offline, the cached `offline.html` is shown instead.
 */
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `htt-cache-${version}`;
const OFFLINE_URL = '/offline.html';
const ASSETS = new Set([...build, ...files]);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...ASSETS]))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	// PocketBase (realtime, API, files) and anything else cross-origin is
	// left to the browser untouched.
	if (url.origin !== sw.location.origin) return;

	// App shell: versioned build output and static files, cache first.
	if (ASSETS.has(url.pathname)) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => (await cache.match(url.pathname)) ?? fetch(request))
		);
		return;
	}

	// Page loads: always the network, offline screen if it is unreachable.
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(async () => {
				const offline = await caches.match(OFFLINE_URL);
				return offline ?? Response.error();
			})
		);
	}
	// Everything else (data requests, form actions, …) goes to the network
	// as if there were no service worker.
});
