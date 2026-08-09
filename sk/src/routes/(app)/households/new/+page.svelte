<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto flex max-w-md flex-col gap-8 py-12">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-stone-900">Bienvenue !</h1>
		<p class="mt-1 text-stone-600">Créez votre foyer, ou rejoignez-en un avec une invitation.</p>
	</div>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">Créer un foyer</h2>
		<form method="post" action="?/create" use:enhance class="mt-4 flex flex-col gap-3">
			{#if form?.action === 'create' && form?.message}
				<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
			{/if}
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				Nom du foyer
				<input
					name="name"
					type="text"
					required
					placeholder="Chez nous"
					value={form?.action === 'create' ? (form?.name ?? '') : ''}
					class="rounded-lg border border-stone-300 px-3 py-2"
				/>
			</label>
			<button type="submit" class="rounded-full bg-stone-900 px-6 py-2.5 font-medium text-white hover:bg-stone-700">
				Créer
			</button>
		</form>
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">Rejoindre un foyer</h2>
		<form method="post" action="?/join" use:enhance class="mt-4 flex flex-col gap-3">
			{#if form?.action === 'join' && form?.message}
				<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
			{/if}
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				Lien ou code d'invitation
				<input name="invite" type="text" placeholder="https://... ou code" class="rounded-lg border border-stone-300 px-3 py-2" />
			</label>
			<button
				type="submit"
				class="rounded-full border border-stone-300 px-6 py-2.5 font-medium text-stone-900 hover:bg-stone-100"
			>
				Rejoindre
			</button>
		</form>
	</section>
</div>
