<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let next = $derived(`/invite/${page.params.code}`);
</script>

<main class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 text-center">
	{#if !data.invite}
		<h1 class="text-2xl font-bold text-stone-900">Invitation introuvable</h1>
		<p class="text-stone-600">Ce lien d'invitation n'est plus valide.</p>
		<a href="/" class="font-medium text-stone-900 underline">Retour à l'accueil</a>
	{:else if data.invite.expired}
		<h1 class="text-2xl font-bold text-stone-900">Invitation expirée</h1>
		<p class="text-stone-600">Demandez un nouveau lien à un membre de « {data.invite.householdName} ».</p>
	{:else if data.invite.exhausted}
		<h1 class="text-2xl font-bold text-stone-900">Invitation épuisée</h1>
		<p class="text-stone-600">Ce lien a déjà été utilisé le nombre maximal de fois autorisé.</p>
	{:else}
		<h1 class="text-2xl font-bold text-stone-900">Rejoindre « {data.invite.householdName} »</h1>

		{#if form?.message}
			<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}

		<form method="post" action="?/redeem" use:enhance>
			<button type="submit" class="w-full rounded-full bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-700">
				Rejoindre ce foyer
			</button>
		</form>

		<p class="text-sm text-stone-500">
			Pas encore de compte ?
			<a href={`/signup?next=${encodeURIComponent(next)}`} class="font-medium text-stone-900 underline">Créez-en un</a>
			d'abord.
		</p>
	{/if}
</main>
