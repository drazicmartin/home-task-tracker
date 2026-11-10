<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Castle, Check, KeyRound, Plus, Settings, TriangleAlert, User, UserPen } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPoints, levelInfo } from '$lib/game';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Coin from '$lib/ui/Coin.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import XpBar from '$lib/ui/XpBar.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const playerName = $derived(data.user?.name || data.user?.email || '');
	const level = $derived(levelInfo(data.playerPoints).level);

	$effect(() => {
		if (form?.success && form.action === 'profile') toast.success(m.account_profile_saved());
		if (form?.success && form.action === 'password') toast.success(m.account_password_changed());
	});
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<PageHeader title={m.account_title()} icon={User} />

	<!-- Player card -->
	<section class="panel flex items-center gap-4 p-4">
		<Avatar
			name={playerName}
			seed={data.user?.id}
			level={data.activeHousehold ? level : undefined}
			class="size-20 text-3xl"
		/>
		<div class="min-w-0 flex-1">
			<p class="text-outline truncate font-display text-2xl leading-tight text-white">{playerName}</p>
			<p class="truncate text-sm font-bold text-night-300">{data.user?.email}</p>
			{#if data.activeHousehold}
				<p class="mt-2 flex items-center gap-2">
					<span class="chip chip-gold">{m.hud_level({ level })}</span>
					<span class="flex items-center gap-1 font-display text-lg leading-none text-gold-200">
						<Coin class="size-5" />{formatPoints(data.playerPoints)}
					</span>
				</p>
				<XpBar points={data.playerPoints} class="mt-2" />
			{/if}
		</div>
	</section>

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><UserPen class="size-5" strokeWidth={3} />{m.account_profile_heading()}</h2>
		{#if form?.action === 'profile' && form?.message}
			<p class="alert-error mt-3" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
		{/if}
		<form method="post" action="?/updateProfile" enctype="multipart/form-data" use:enhance class="mt-4 flex flex-col gap-4">
			<label class="field">
				<span class="field-label">{m.account_name()}</span>
				<input name="name" type="text" required value={data.user?.name ?? ''} class="input" />
			</label>
			<label class="field">
				<span class="field-label">{m.account_email()}</span>
				<input type="email" disabled value={data.user?.email ?? ''} class="input" />
			</label>
			<label class="field">
				<span class="field-label">{m.account_language()}</span>
				<select name="locale" class="input">
					<option value="fr" selected={data.user?.locale !== 'en'}>{m.account_french()}</option>
					<option value="en" selected={data.user?.locale === 'en'}>{m.account_english()}</option>
				</select>
			</label>
			<label class="field">
				<span class="field-label">{m.account_avatar()}</span>
				<input name="avatar" type="file" accept="image/*" class="input" />
			</label>
			<button type="submit" class="btn btn-gold btn-block">
				<Check class="size-5" strokeWidth={3.5} />{m.account_save()}
			</button>
		</form>
	</section>

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><KeyRound class="size-5" strokeWidth={3} />{m.account_password_heading()}</h2>
		{#if form?.action === 'password' && form?.message}
			<p class="alert-error mt-3" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
		{/if}
		<form method="post" action="?/changePassword" use:enhance class="mt-4 flex flex-col gap-4">
			<label class="field">
				<span class="field-label">{m.account_old_password()}</span>
				<input name="oldPassword" type="password" required autocomplete="current-password" class="input" />
			</label>
			<label class="field">
				<span class="field-label">{m.account_new_password()}</span>
				<input name="password" type="password" required minlength="8" autocomplete="new-password" class="input" />
			</label>
			<label class="field">
				<span class="field-label">{m.account_confirm_password()}</span>
				<input name="passwordConfirm" type="password" required minlength="8" autocomplete="new-password" class="input" />
			</label>
			<button type="submit" class="btn btn-blue btn-block">
				<KeyRound class="size-5" strokeWidth={3} />{m.account_change_password()}
			</button>
		</form>
	</section>

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><Castle class="size-5" strokeWidth={3} />{m.account_households_heading()}</h2>
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.households as household (household.id)}
				<li class="panel-inset flex items-center justify-between gap-3 py-2 pr-2 pl-4">
					<span class="truncate font-display text-lg text-white">{household.name}</span>
					<a
						href="/households/{household.id}/settings"
						class="btn btn-icon btn-sm"
						aria-label="{m.nav_settings()} – {household.name}"
						title={m.nav_settings()}
					>
						<Settings class="size-4" strokeWidth={3} />
					</a>
				</li>
			{/each}
		</ul>
		<a href="/households/new" class="btn btn-sm btn-block mt-3 whitespace-normal">
			<Plus class="size-4 shrink-0" strokeWidth={3.5} />{m.account_join_another()}
		</a>
	</section>
</div>
