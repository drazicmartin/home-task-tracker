<script lang="ts">
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages.js';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let menuOpen = $state(false);

	const links = $derived([
		{ href: '/board', label: m.nav_tasks() },
		{ href: '/dashboard', label: m.nav_dashboard() },
		{ href: '/leaderboard', label: m.nav_leaderboard() },
		{ href: '/history', label: m.nav_history() }
	]);

	$effect(() => {
		page.url.pathname;
		menuOpen = false;
	});
</script>

<div class="min-h-screen bg-stone-50">
	<header class="border-b border-stone-200 bg-white">
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
			<div class="flex min-w-0 items-center gap-6">
				<span class="shrink-0 font-bold text-stone-900">HTT</span>
				{#if data.activeHousehold}
					<nav class="hidden gap-1 sm:flex">
						{#each links as link (link.href)}
							<a
								href={link.href}
								class="rounded-full px-3 py-1.5 text-sm font-medium transition {page.url.pathname === link.href
									? 'bg-stone-900 text-white'
									: 'text-stone-600 hover:bg-stone-100'}"
							>
								{link.label}
							</a>
						{/each}
					</nav>
				{/if}
			</div>
			<div class="hidden items-center gap-3 sm:flex">
				{#if data.activeHousehold}
					{#if data.households.length > 1}
						<form method="post" action="/households/switch">
							<select
								name="householdId"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm"
							>
								{#each data.households as household (household.id)}
									<option value={household.id} selected={household.id === data.activeHousehold.id}>
										{household.name}
									</option>
								{/each}
							</select>
						</form>
					{:else}
						<span class="text-sm text-stone-500">{data.activeHousehold.name}</span>
					{/if}
					<a href="/households/{data.activeHousehold.id}/settings" class="text-sm text-stone-600 hover:text-stone-900">
						{m.nav_settings()}
					</a>
				{/if}
				<a href="/account" class="text-sm text-stone-600 hover:text-stone-900">{m.nav_account()}</a>
				<form method="post" action="/logout">
					<button type="submit" class="text-sm text-stone-600 hover:text-stone-900">{m.nav_logout()}</button>
				</form>
			</div>
			<button
				type="button"
				aria-label={m.nav_menu()}
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 sm:hidden"
			>
				{#if menuOpen}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>

		{#if menuOpen}
			<div class="flex flex-col gap-3 border-t border-stone-200 px-4 py-3 sm:hidden">
				{#if data.activeHousehold}
					<div class="flex flex-col gap-1">
						{#each links as link (link.href)}
							<a
								href={link.href}
								class="rounded-lg px-3 py-2 text-sm font-medium transition {page.url.pathname === link.href
									? 'bg-stone-900 text-white'
									: 'text-stone-600 hover:bg-stone-100'}"
							>
								{link.label}
							</a>
						{/each}
					</div>

					{#if data.households.length > 1}
						<form method="post" action="/households/switch">
							<select
								name="householdId"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
								class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
							>
								{#each data.households as household (household.id)}
									<option value={household.id} selected={household.id === data.activeHousehold.id}>
										{household.name}
									</option>
								{/each}
							</select>
						</form>
					{:else}
						<span class="px-3 text-sm text-stone-500">{data.activeHousehold.name}</span>
					{/if}

					<a
						href="/households/{data.activeHousehold.id}/settings"
						class="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
					>
						{m.nav_settings()}
					</a>
				{/if}
				<a href="/account" class="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">{m.nav_account()}</a>
				<form method="post" action="/logout">
					<button type="submit" class="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-100">
						{m.nav_logout()}
					</button>
				</form>
			</div>
		{/if}
	</header>

	<main class="mx-auto max-w-4xl px-4 py-8">
		{@render children()}
	</main>
</div>
