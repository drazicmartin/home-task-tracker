<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { createBrowserPb } from '$lib/pocketbaseBrowser';
	import { env } from '$env/dynamic/public';
	import * as m from '$lib/paraglide/messages.js';

	let { providers, next }: { providers: Array<{ name: string; displayName: string }>; next?: string | null } =
		$props();

	let pending = $state(false);

	class OAuth2TimeoutError extends Error {}

	async function login(providerName: string) {
		pending = true;
		try {
			if (!env.PUBLIC_PB_URL) {
				// The single most common cause of "popup opens then immediately
				// closes": the browser has no way to reach PocketBase directly
				// (this flow can't go through the sk server), so listAuthMethods()
				// fails before the popup ever navigates to Authentik.
				console.error(
					'PUBLIC_PB_URL is not set — the browser cannot reach PocketBase directly, which this login flow requires. Set it to the public URL of the "pb" service.'
				);
				throw new Error('PUBLIC_PB_URL is not configured');
			}

			const pb = createBrowserPb();
			// PocketBase's LocalAuthStore reads live from localStorage, and the
			// SDK auto-attaches any existing token as the Authorization header
			// on every request — including the OAuth2 exchange. If this browser
			// still has a stale session (e.g. from testing email/password login
			// earlier), that makes PocketBase try to link Authentik to whatever
			// account that stale token belongs to instead of creating a fresh
			// one, which fails as soon as the two don't match ("Failed to
			// create record"). This flow should always start from a clean slate.
			pb.authStore.clear();

			// authWithOAuth2() opens a PocketBase Realtime (SSE) subscription
			// *before* it navigates the popup to the provider — if that hangs
			// (e.g. a reverse proxy gzip-compressing the SSE response, which
			// breaks it outright), the popup just sits on about:blank forever
			// with no error of its own. Time it out so the user gets feedback.
			const timeout = new Promise((_, reject) => {
				setTimeout(() => reject(new OAuth2TimeoutError()), 15000);
			});
			await Promise.race([pb.collection('users').authWithOAuth2({ provider: providerName }), timeout]);

			const res = await fetch('/auth/oauth2-callback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: pb.authStore.token })
			});
			if (!res.ok) throw new Error('sync failed');

			await goto(next && next.startsWith('/') && !next.startsWith('//') ? next : '/board', {
				invalidateAll: true
			});
		} catch (error) {
			if (error instanceof OAuth2TimeoutError) {
				console.error(
					'Authentik login timed out waiting for the popup to complete. This usually means PocketBase\'s realtime (SSE) connection is being buffered/compressed by a reverse proxy — see the README for the Coolify fix (disable compression for the "pb" service).'
				);
				toast.error(m.oauth_timeout());
			} else {
				console.error('Authentik login failed:', error);
				toast.error(m.oauth_login_failed());
			}
		} finally {
			pending = false;
		}
	}
</script>

{#if providers.length > 0}
	<div class="flex flex-col gap-2">
		{#each providers as provider (provider.name)}
			<button
				type="button"
				disabled={pending}
				onclick={() => login(provider.name)}
				class="rounded-full border border-stone-300 px-6 py-3 font-medium text-stone-900 transition hover:bg-stone-100 disabled:opacity-50"
			>
				{m.oauth_continue_with({ provider: provider.displayName })}
			</button>
		{/each}
	</div>
	<div class="flex items-center gap-3 text-xs text-stone-400">
		<span class="h-px flex-1 bg-stone-200"></span>
		{m.oauth_or()}
		<span class="h-px flex-1 bg-stone-200"></span>
	</div>
{/if}
