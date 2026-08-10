<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto flex max-w-md flex-col gap-8 py-12">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-stone-900">{m.households_new_title()}</h1>
		<p class="mt-1 text-stone-600">{m.households_new_subtitle()}</p>
	</div>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">{m.households_new_create_heading()}</h2>
		<form method="post" action="?/create" use:enhance class="mt-4 flex flex-col gap-3">
			{#if form?.action === 'create' && form?.message}
				<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
			{/if}
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.households_new_name_label()}
				<input
					name="name"
					type="text"
					required
					placeholder={m.households_new_name_placeholder()}
					value={form?.action === 'create' ? (form?.name ?? '') : ''}
					class="rounded-lg border border-stone-300 px-3 py-2"
				/>
			</label>
			<button type="submit" class="rounded-full bg-stone-900 px-6 py-2.5 font-medium text-white hover:bg-stone-700">
				{m.households_new_create_button()}
			</button>
		</form>
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">{m.households_new_join_heading()}</h2>
		<form method="post" action="?/join" use:enhance class="mt-4 flex flex-col gap-3">
			{#if form?.action === 'join' && form?.message}
				<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
			{/if}
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.households_new_invite_label()}
				<input
					name="invite"
					type="text"
					placeholder={m.households_new_invite_placeholder()}
					class="rounded-lg border border-stone-300 px-3 py-2"
				/>
			</label>
			<button
				type="submit"
				class="rounded-full border border-stone-300 px-6 py-2.5 font-medium text-stone-900 hover:bg-stone-100"
			>
				{m.households_new_join_button()}
			</button>
		</form>
	</section>
</div>
