<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let next = $derived(`/invite/${page.params.code}`);
</script>

<main class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 text-center">
	{#if !data.invite}
		<h1 class="text-2xl font-bold text-stone-900">{m.invite_not_found_title()}</h1>
		<p class="text-stone-600">{m.invite_not_found_body()}</p>
		<a href="/" class="font-medium text-stone-900 underline">{m.invite_back_home()}</a>
	{:else if data.invite.expired}
		<h1 class="text-2xl font-bold text-stone-900">{m.invite_expired_title()}</h1>
		<p class="text-stone-600">{m.invite_expired_body({ household: data.invite.householdName })}</p>
	{:else if data.invite.exhausted}
		<h1 class="text-2xl font-bold text-stone-900">{m.invite_exhausted_title()}</h1>
		<p class="text-stone-600">{m.invite_exhausted_body()}</p>
	{:else}
		<h1 class="text-2xl font-bold text-stone-900">{m.invite_join_title({ household: data.invite.householdName })}</h1>

		{#if form?.message}
			<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}

		<form method="post" action="?/redeem" use:enhance>
			<button type="submit" class="w-full rounded-full bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-700">
				{m.invite_join_button()}
			</button>
		</form>

		<p class="text-sm text-stone-500">
			{m.invite_no_account()}
			<a href={`/signup?next=${encodeURIComponent(next)}`} class="font-medium text-stone-900 underline">{m.invite_create_one()}</a>
			{m.invite_first()}
		</p>
	{/if}
</main>
