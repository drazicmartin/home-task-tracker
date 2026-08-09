<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import OAuth2Button from '$lib/OAuth2Button.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let next = $derived(page.url.searchParams.get('next'));
</script>

<main class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
	<h1 class="text-2xl font-bold text-stone-900">{m.signup_title()}</h1>

	<OAuth2Button providers={data.oauth2Providers} {next} />

	<form method="post" action={next ? `?next=${encodeURIComponent(next)}` : undefined} use:enhance class="flex flex-col gap-4">
		{#if form?.message}
			<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}

		<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
			{m.signup_name()}
			<input
				name="name"
				type="text"
				required
				value={form?.name ?? ''}
				class="rounded-lg border border-stone-300 px-3 py-2"
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
			{m.signup_email()}
			<input
				name="email"
				type="email"
				required
				value={form?.email ?? ''}
				class="rounded-lg border border-stone-300 px-3 py-2"
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
			{m.signup_password()}
			<input name="password" type="password" required minlength="8" class="rounded-lg border border-stone-300 px-3 py-2" />
		</label>

		<button type="submit" class="rounded-full bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-700">
			{m.signup_submit()}
		</button>
	</form>

	<p class="text-center text-sm text-stone-600">
		{m.signup_has_account()}
		<a
			href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
			class="font-medium text-stone-900 underline"
		>
			{m.signup_login_link()}
		</a>
	</p>
</main>
