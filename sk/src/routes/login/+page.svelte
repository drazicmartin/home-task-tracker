<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { LogIn, TriangleAlert } from '@lucide/svelte';
	import OAuth2Button from '$lib/OAuth2Button.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import Logo from '$lib/ui/Logo.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let next = $derived(page.url.searchParams.get('next'));
</script>

<main
	class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 pt-[calc(2rem_+_env(safe-area-inset-top))] pb-[calc(2rem_+_env(safe-area-inset-bottom))]"
>
	<a href="/" class="self-center"><Logo size="sm" tag="div" /></a>

	<section class="panel flex flex-col gap-5 p-5">
		<h1 class="text-outline text-center font-display text-3xl text-white">{m.login_title()}</h1>

		<OAuth2Button providers={data.oauth2Providers} {next} />

		<form method="post" action={next ? `?next=${encodeURIComponent(next)}` : undefined} use:enhance class="flex flex-col gap-4">
			{#if form?.message}
				<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
			{/if}

			<label class="field">
				<span class="field-label">{m.login_email()}</span>
				<input name="email" type="email" required autocomplete="email" value={form?.email ?? ''} class="input" />
			</label>

			<label class="field">
				<span class="field-label">{m.login_password()}</span>
				<input name="password" type="password" required autocomplete="current-password" class="input" />
			</label>

			<button type="submit" class="btn btn-gold btn-block shine mt-1">
				<LogIn class="size-5" strokeWidth={3} />{m.login_submit()}
			</button>
		</form>
	</section>

	<p class="text-center text-sm font-bold text-night-200">
		{m.login_no_account()}
		<a href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} class="link">{m.login_signup_link()}</a>
	</p>
</main>
