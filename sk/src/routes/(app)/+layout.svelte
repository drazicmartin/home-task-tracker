<script lang="ts">
	import { page } from '$app/state';
	import { Dialog } from 'bits-ui';
	import { ChartColumn, LogOut, MessageSquare, Pause, Play, Plus, ScrollText, Settings, Swords, Trophy, User } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPoints, levelInfo } from '$lib/game';
	import HouseholdSwitcher from '$lib/HouseholdSwitcher.svelte';
	import { householdKind } from '$lib/householdKinds';
	import { KIND_COLORS, KIND_ICONS, KIND_LABELS } from '$lib/kindUi';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Coin from '$lib/ui/Coin.svelte';
	import XpBar from '$lib/ui/XpBar.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let menuOpen = $state(false);

	const playerName = $derived(data.user?.name || data.user?.email || '');
	const level = $derived(levelInfo(data.playerPoints).level);
	const activeKind = $derived(householdKind(data.activeHousehold));
	const ActiveKindIcon = $derived(KIND_ICONS[activeKind]);

	const tabs = $derived([
		{ href: '/board', label: m.nav_tasks(), icon: Swords },
		{ href: '/dashboard', label: m.nav_dashboard(), icon: ChartColumn },
		{ href: '/leaderboard', label: m.nav_leaderboard(), icon: Trophy },
		{ href: '/history', label: m.nav_history(), icon: ScrollText }
	]);

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	$effect(() => {
		page.url.pathname;
		menuOpen = false;
	});
</script>

<div class="min-h-dvh">
	<!-- HUD: player portrait + level, XP bar, coins, pause -->
	<header
		class="sticky top-0 z-40 border-b-[3px] border-night-950 bg-gradient-to-b from-night-800/95 to-night-900/85 pt-[env(safe-area-inset-top)] shadow-[0_8px_24px_-12px_rgb(0_0_0/0.8)] backdrop-blur-md"
	>
		<div class="mx-auto flex max-w-4xl items-center gap-2.5 px-3 py-2.5 sm:px-4">
			<a href="/account" class="flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-0.5 pr-2">
				<Avatar
					name={playerName}
					seed={data.user?.id}
					level={data.activeHousehold ? level : undefined}
					class="size-11 text-lg"
				/>
				<span class="flex min-w-0 flex-1 flex-col">
					<span class="text-outline truncate font-display text-[1.05rem] leading-tight text-white">{playerName}</span>
					{#if data.activeHousehold}
						<XpBar points={data.playerPoints} class="mt-1 max-w-56" />
					{/if}
				</span>
			</a>

			{#if data.activeHousehold}
				<span class="counter">
					<Coin class="size-6" />
					<span aria-hidden="true">{formatPoints(data.playerPoints)}</span>
					<span class="sr-only">{m.hud_points({ points: formatPoints(data.playerPoints) })}</span>
				</span>
			{/if}

			<button
				type="button"
				aria-label={m.nav_menu()}
				aria-haspopup="dialog"
				onclick={() => (menuOpen = true)}
				class="btn btn-icon btn-sm"
			>
				<Pause class="size-5" strokeWidth={3} fill="currentColor" />
			</button>
		</div>

		{#if data.activeHousehold}
			<HouseholdSwitcher households={data.households} activeId={data.activeHousehold.id} />
		{/if}
	</header>

	<main
		class="mx-auto max-w-4xl px-4 pt-5 sm:px-6 {data.activeHousehold
			? 'pb-[calc(7.5rem_+_env(safe-area-inset-bottom))]'
			: 'pb-12'}"
	>
		{@render children()}
	</main>

	<!-- Bottom tab bar: where thumbs are on a phone, and still tidy on desktop -->
	{#if data.activeHousehold}
		<nav
			class="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-night-950/95 via-night-950/60 to-transparent px-3 pt-8 pb-[calc(0.6rem_+_env(safe-area-inset-bottom))]"
		>
			<div class="tabbar pointer-events-auto mx-auto max-w-md">
				{#each tabs as tab (tab.href)}
					<a href={tab.href} class="tab" aria-current={isActive(tab.href) ? 'page' : undefined}>
						<span class="tab-icon"><tab.icon class="size-5" strokeWidth={2.75} /></span>
						<span class="tab-label">{tab.label}</span>
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</div>

<!-- Pause menu -->
<Dialog.Root bind:open={menuOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="overlay" />
		<Dialog.Content class="panel sheet">
			<div class="mb-5 flex justify-center">
				<Dialog.Title class="ribbon">
					<Pause class="size-4" strokeWidth={3} fill="currentColor" />
					{m.menu_title()}
				</Dialog.Title>
			</div>

			<div class="flex flex-col gap-3">
				<Dialog.Close class="btn btn-gold btn-block">
					<Play class="size-5" strokeWidth={3} fill="currentColor" />
					{m.menu_resume()}
				</Dialog.Close>

				{#if data.activeHousehold}
					<section class="panel-inset flex flex-col gap-2.5 p-3">
						<div class="flex items-center gap-3">
							<span
								class="grid size-10 shrink-0 place-items-center rounded-xl border-[3px] border-night-950 text-white"
								style="background: {KIND_COLORS[activeKind]}"
								aria-hidden="true"
							>
								<ActiveKindIcon class="size-5" strokeWidth={2.75} />
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-display text-xl leading-tight text-white">{data.activeHousehold.name}</span>
								<span class="field-label">{KIND_LABELS[activeKind]()}</span>
							</span>
						</div>
						<div class="grid grid-cols-2 gap-2">
							<a href="/households/{data.activeHousehold.id}/settings" class="btn btn-sm">
								<Settings class="size-4" strokeWidth={3} />
								{m.nav_settings()}
							</a>
							<a href="/households/new" class="btn btn-sm btn-green">
								<Plus class="size-4" strokeWidth={3.5} />
								{m.menu_new_household()}
							</a>
						</div>
					</section>
				{/if}

				<a href="/account" class="btn btn-blue btn-block">
					<User class="size-5" strokeWidth={3} />
					{m.nav_account()}
				</a>

				<a
					href="/feedback?from={encodeURIComponent(page.url.pathname)}"
					class="btn btn-block"
				>
					<MessageSquare class="size-5" strokeWidth={3} />
					{m.nav_feedback()}
				</a>

				<form method="post" action="/logout">
					<button type="submit" class="btn btn-red btn-block">
						<LogOut class="size-5" strokeWidth={3} />
						{m.nav_logout()}
					</button>
				</form>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
