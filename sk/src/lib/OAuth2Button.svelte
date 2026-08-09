<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { createBrowserPb } from '$lib/pocketbaseBrowser';
	import { env } from '$env/dynamic/public';
	import * as m from '$lib/paraglide/messages.js';

	let { providers, next }: { providers: Array<{ name: string; displayName: string }>; next?: string | null } =
		$props();

	let pending = $state(false);

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
			await pb.collection('users').authWithOAuth2({ provider: providerName });

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
			console.error('Authentik login failed:', error);
			toast.error(m.oauth_login_failed());
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
