<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	$effect(() => {
		if (form?.success && form.action === 'profile') toast.success(m.account_profile_saved());
		if (form?.success && form.action === 'password') toast.success(m.account_password_changed());
	});
</script>

<div class="mx-auto flex max-w-md flex-col gap-8">
	<h1 class="text-2xl font-bold text-stone-900">{m.account_title()}</h1>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">{m.account_profile_heading()}</h2>
		{#if form?.action === 'profile' && form?.message}
			<p class="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<form method="post" action="?/updateProfile" enctype="multipart/form-data" use:enhance class="mt-4 flex flex-col gap-4">
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.account_name()}
				<input name="name" type="text" required value={data.user?.name ?? ''} class="rounded-lg border border-stone-300 px-3 py-2" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.account_email()}
				<input type="email" disabled value={data.user?.email ?? ''} class="rounded-lg border border-stone-300 bg-stone-100 px-3 py-2 text-stone-500" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.account_language()}
				<select name="locale" class="rounded-lg border border-stone-300 px-3 py-2">
					<option value="fr" selected={data.user?.locale !== 'en'}>{m.account_french()}</option>
					<option value="en" selected={data.user?.locale === 'en'}>{m.account_english()}</option>
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.account_avatar()}
				<input name="avatar" type="file" accept="image/*" class="text-sm" />
			</label>
			<div class="flex justify-end">
				<button type="submit" class="rounded-full bg-stone-900 px-6 py-2.5 font-medium text-white hover:bg-stone-700">
					{m.account_save()}
				</button>
			</div>
		</form>
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">{m.account_password_heading()}</h2>
		{#if form?.action === 'password' && form?.message}
			<p class="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<form method="post" action="?/changePassword" use:enhance class="mt-4 flex flex-col gap-4">
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.account_old_password()}
				<input name="oldPassword" type="password" required class="rounded-lg border border-stone-300 px-3 py-2" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.account_new_password()}
				<input name="password" type="password" required minlength="8" class="rounded-lg border border-stone-300 px-3 py-2" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
				{m.account_confirm_password()}
				<input name="passwordConfirm" type="password" required minlength="8" class="rounded-lg border border-stone-300 px-3 py-2" />
			</label>
			<div class="flex justify-end">
				<button type="submit" class="rounded-full bg-stone-900 px-6 py-2.5 font-medium text-white hover:bg-stone-700">
					{m.account_change_password()}
				</button>
			</div>
		</form>
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">{m.account_households_heading()}</h2>
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.households as household (household.id)}
				<li class="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-2">
					<span class="text-stone-800">{household.name}</span>
					<a href="/households/{household.id}/settings" class="text-sm text-stone-600 underline hover:text-stone-900">
						{m.nav_settings()}
					</a>
				</li>
			{/each}
		</ul>
		<a href="/households/new" class="mt-3 inline-block text-sm text-stone-600 underline hover:text-stone-900">
			{m.account_join_another()}
		</a>
	</section>
</div>
