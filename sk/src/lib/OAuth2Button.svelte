<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { createBrowserPb } from '$lib/pocketbaseBrowser';

	let { providers, next }: { providers: Array<{ name: string; displayName: string }>; next?: string | null } =
		$props();

	let pending = $state(false);

	async function login(providerName: string) {
		pending = true;
		try {
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
		} catch {
			toast.error('Connexion impossible. Réessayez.');
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
				Continuer avec {provider.displayName}
			</button>
		{/each}
	</div>
	<div class="flex items-center gap-3 text-xs text-stone-400">
		<span class="h-px flex-1 bg-stone-200"></span>
		ou
		<span class="h-px flex-1 bg-stone-200"></span>
	</div>
{/if}
