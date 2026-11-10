<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { LoaderCircle, Plus } from '@lucide/svelte';
	import { householdKind } from '$lib/householdKinds';
	import { KIND_COLORS, KIND_ICONS, KIND_LABELS } from '$lib/kindUi';
	import * as m from '$lib/paraglide/messages.js';

	type Household = { id: string; name: string; kind?: string };

	/**
	 * One-tap navigation between the user's households: a scrollable row of
	 * pills (kind icon + name) under the HUD, plus a "+" to create/join one.
	 * Switching keeps you on the same screen (board, stats, leaderboard,
	 * journal, settings) of the other household.
	 */
	let { households, activeId }: { households: Household[]; activeId: string } = $props();

	let switching = $state<string | null>(null);
	let strip = $state<HTMLElement>();

	const SECTIONS = ['/board', '/dashboard', '/leaderboard', '/history'];

	/** Where to land in the other household. */
	function targetFor(householdId: string): string {
		const path = page.url.pathname;
		if (SECTIONS.includes(path)) return path;
		if (/^\/households\/[^/]+\/settings$/.test(path)) return `/households/${householdId}/settings`;
		return '/board';
	}

	async function switchTo(event: SubmitEvent, householdId: string) {
		event.preventDefault();
		if (switching) return;
		switching = householdId;
		const next = targetFor(householdId);
		const body = new FormData();
		body.set('householdId', householdId);
		body.set('next', next);
		try {
			const response = await fetch('/households/switch', {
				method: 'POST',
				body,
				headers: { accept: 'application/json' }
			});
			await goto(response.ok ? next : '/board', { invalidateAll: true });
		} finally {
			switching = null;
		}
	}

	// keep the active pill in view (e.g. the 5th household on a phone)
	$effect(() => {
		activeId;
		strip?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	});
</script>

<nav aria-label={m.menu_switch_household()} class="mx-auto max-w-4xl">
	<ul bind:this={strip} class="strip flex gap-2 overflow-x-auto px-3 pt-0.5 pb-2.5 sm:px-4">
		{#each households as household (household.id)}
			{@const kind = householdKind(household)}
			{@const Icon = KIND_ICONS[kind]}
			<li class="shrink-0">
				{#if household.id === activeId}
					<span class="pill pill-active" aria-current="true">
						<span class="pill-icon" style="--c: {KIND_COLORS[kind]}"><Icon class="size-3.5" strokeWidth={3} /></span>
						<span class="pill-name">{household.name}</span>
					</span>
				{:else}
					<form method="post" action="/households/switch" onsubmit={(e) => switchTo(e, household.id)}>
						<input type="hidden" name="householdId" value={household.id} />
						<input type="hidden" name="next" value={targetFor(household.id)} />
						<button type="submit" class="pill" disabled={switching !== null} title={KIND_LABELS[kind]()}>
							<span class="pill-icon" style="--c: {KIND_COLORS[kind]}">
								{#if switching === household.id}
									<LoaderCircle class="size-3.5 animate-spin" strokeWidth={3} />
								{:else}
									<Icon class="size-3.5" strokeWidth={3} />
								{/if}
							</span>
							<span class="pill-name">{household.name}</span>
						</button>
					</form>
				{/if}
			</li>
		{/each}
		<li class="shrink-0">
			<a href="/households/new" class="pill pill-new" aria-label={m.menu_new_household()}>
				<Plus class="size-4" strokeWidth={3.5} />
				<span>{m.households_switcher_new()}</span>
			</a>
		</li>
	</ul>
</nav>

<style>
	.strip {
		scrollbar-width: none;
		overscroll-behavior-x: contain;
	}
	.strip::-webkit-scrollbar {
		display: none;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		height: 2.1rem;
		padding: 0 0.75rem 0 0.3rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: var(--color-night-700);
		color: var(--color-night-100);
		font-weight: 900;
		font-size: 0.85rem;
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.08),
			0 2px 0 var(--color-night-950);
		cursor: pointer;
		transition:
			transform 80ms,
			background-color 120ms;
	}
	.pill:hover:not(:disabled):not(.pill-active) {
		background: var(--color-night-600);
	}
	.pill:active:not(:disabled):not(.pill-active) {
		transform: translateY(2px);
		box-shadow: none;
	}
	.pill:disabled {
		cursor: progress;
		opacity: 0.75;
	}
	.pill:focus-visible {
		outline: 3px solid var(--color-gold-300);
		outline-offset: 2px;
	}
	.pill-active {
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		cursor: default;
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.5),
			0 2px 0 var(--color-night-950);
	}
	.pill-new {
		padding: 0 0.75rem 0 0.55rem;
		border-style: dashed;
		border-color: var(--color-night-400);
		background: transparent;
		color: var(--color-night-200);
		box-shadow: none;
	}
	.pill-icon {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: var(--c);
		color: white;
	}
	.pill-name {
		max-width: 11rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
