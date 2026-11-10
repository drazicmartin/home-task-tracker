<script lang="ts">
	import { enhance } from '$app/forms';
	import { Castle, DoorOpen, Sparkles, TriangleAlert } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto flex max-w-md flex-col gap-5 py-4">
	<div class="flex flex-col items-center gap-2 text-center">
		<span class="ribbon text-2xl"><Sparkles class="size-5" strokeWidth={3} />{m.households_new_title()}</span>
		<p class="mt-2 font-bold text-night-200">{m.households_new_subtitle()}</p>
	</div>

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><Castle class="size-5" strokeWidth={3} />{m.households_new_create_heading()}</h2>
		<form method="post" action="?/create" use:enhance class="mt-4 flex flex-col gap-3">
			{#if form?.action === 'create' && form?.message}
				<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
			{/if}
			<label class="field">
				<span class="field-label">{m.households_new_name_label()}</span>
				<input
					name="name"
					type="text"
					required
					placeholder={m.households_new_name_placeholder()}
					value={form?.action === 'create' ? (form?.name ?? '') : ''}
					class="input"
				/>
			</label>
			<button type="submit" class="btn btn-gold btn-block shine">{m.households_new_create_button()}</button>
		</form>
	</section>

	<div class="flex items-center gap-3 text-xs font-black tracking-widest text-night-300 uppercase" aria-hidden="true">
		<span class="h-[3px] flex-1 rounded-full bg-night-700"></span>
		{m.oauth_or()}
		<span class="h-[3px] flex-1 rounded-full bg-night-700"></span>
	</div>

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><DoorOpen class="size-5" strokeWidth={3} />{m.households_new_join_heading()}</h2>
		<form method="post" action="?/join" use:enhance class="mt-4 flex flex-col gap-3">
			{#if form?.action === 'join' && form?.message}
				<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
			{/if}
			<label class="field">
				<span class="field-label">{m.households_new_invite_label()}</span>
				<input name="invite" type="text" placeholder={m.households_new_invite_placeholder()} class="input" />
			</label>
			<button type="submit" class="btn btn-blue btn-block">{m.households_new_join_button()}</button>
		</form>
	</section>
</div>
