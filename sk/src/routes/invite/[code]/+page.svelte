<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Castle, Hourglass, Link2Off, TriangleAlert } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import Logo from '$lib/ui/Logo.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let next = $derived(`/invite/${page.params.code}`);
</script>

<main
	class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 pt-[calc(2rem_+_env(safe-area-inset-top))] pb-[calc(2rem_+_env(safe-area-inset-bottom))] text-center"
>
	<a href="/" class="self-center"><Logo size="sm" tag="div" /></a>

	<section class="panel flex flex-col items-center gap-4 p-6">
		{#if !data.invite || data.invite.expired || data.invite.exhausted}
			<span class="grid size-16 place-items-center rounded-2xl border-[3px] border-night-950 bg-night-600">
				{#if data.invite?.expired}
					<Hourglass class="size-8 text-night-200" strokeWidth={2.5} />
				{:else}
					<Link2Off class="size-8 text-night-200" strokeWidth={2.5} />
				{/if}
			</span>
		{/if}

		{#if !data.invite}
			<h1 class="text-outline font-display text-2xl text-white">{m.invite_not_found_title()}</h1>
			<p class="font-bold text-night-200">{m.invite_not_found_body()}</p>
			<a href="/" class="btn btn-blue">{m.invite_back_home()}</a>
		{:else if data.invite.expired}
			<h1 class="text-outline font-display text-2xl text-white">{m.invite_expired_title()}</h1>
			<p class="font-bold text-night-200">{m.invite_expired_body({ household: data.invite.householdName })}</p>
		{:else if data.invite.exhausted}
			<h1 class="text-outline font-display text-2xl text-white">{m.invite_exhausted_title()}</h1>
			<p class="font-bold text-night-200">{m.invite_exhausted_body()}</p>
		{:else}
			<span
				class="grid size-20 animate-float place-items-center rounded-3xl border-[3px] border-night-950 bg-gradient-to-b from-gold-300 to-gold-500 text-gold-900 shadow-[inset_0_3px_0_rgb(255_255_255/0.5),inset_0_-5px_0_var(--color-gold-600),0_5px_0_var(--color-night-950)]"
			>
				<Castle class="size-10" strokeWidth={2.5} />
			</span>
			<h1 class="text-outline font-display text-2xl leading-tight text-white">
				{m.invite_join_title({ household: data.invite.householdName })}
			</h1>

			{#if form?.message}
				<p class="alert-error w-full text-left" role="alert">
					<TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}
				</p>
			{/if}

			<form method="post" action="?/redeem" use:enhance class="w-full">
				<button type="submit" class="btn btn-gold btn-block shine">{m.invite_join_button()}</button>
			</form>

			<p class="text-sm font-bold text-night-200">
				{m.invite_no_account()}
				<a href={`/signup?next=${encodeURIComponent(next)}`} class="link">{m.invite_create_one()}</a>
				{m.invite_first()}
			</p>
		{/if}
	</section>
</main>
