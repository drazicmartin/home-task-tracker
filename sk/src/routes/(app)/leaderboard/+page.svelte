<script lang="ts">
	import { Crown, Trophy } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import WindowToggle from '$lib/WindowToggle.svelte';
	import { formatPoints } from '$lib/game';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Coin from '$lib/ui/Coin.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const podium = $derived(data.ranking.slice(0, 3));
	const rest = $derived(data.ranking.slice(3));
	const maxTotal = $derived(Math.max(1, ...data.ranking.map((r) => r.total)));

	// Podium columns, in rank order: 1st in the middle, 2nd left, 3rd right.
	const podiumColumn = [2, 1, 3];
</script>

<div class="flex flex-col gap-4">
	<PageHeader title={m.leaderboard_title()} eyebrow={data.activeHousehold?.name} icon={Trophy} />

	<WindowToggle current={data.window} />

	{#if data.ranking.length === 0}
		<EmptyState icon={Trophy} message={m.leaderboard_empty()} />
	{:else}
		<!-- DOM order is rank order (for screen readers); grid-column places them on the podium -->
		<ol class="grid grid-cols-3 items-end gap-2 px-1 pt-8">
			{#each podium as entry, i (entry.id)}
				<li class="slot animate-rise" style="grid-column: {podiumColumn[i]}; grid-row: 1; animation-delay: {[150, 0, 300][i]}ms">
					<div class="relative">
						{#if i === 0}
							<Crown class="crown" strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
						{/if}
						<Avatar name={entry.name} seed={entry.id} class={i === 0 ? 'size-16 text-2xl' : 'size-13 text-xl'} />
					</div>
					<span class="mt-2 flex max-w-full flex-col items-center">
						<span class="text-outline w-full truncate text-center font-display text-base leading-tight text-white">
							{entry.name}
						</span>
						{#if entry.id === data.user?.id}
							<span class="chip chip-gold mt-1">{m.leaderboard_you()}</span>
						{/if}
					</span>
					<span class="mt-1.5 flex items-center gap-1 font-display text-lg leading-none text-gold-200">
						<Coin class="size-5" />{formatPoints(entry.total)}
						<span class="sr-only">{m.board_pts({ score: formatPoints(entry.total) })}</span>
					</span>
					<div class="step rank-{i + 1}" aria-hidden="true">
						<span class="text-outline font-display">{i + 1}</span>
					</div>
				</li>
			{/each}
		</ol>

		{#if rest.length > 0}
			<ol start="4" class="flex flex-col gap-2.5">
				{#each rest as entry, i (entry.id)}
					<li class="panel flex items-center gap-3 px-3 py-2.5">
						<span class="rank text-outline font-display" aria-hidden="true">{i + 4}</span>
						<Avatar name={entry.name} seed={entry.id} class="size-10 text-base" />
						<div class="min-w-0 flex-1">
							<p class="flex items-center gap-2">
								<span class="truncate font-display text-lg leading-tight text-white">{entry.name}</span>
								{#if entry.id === data.user?.id}
									<span class="chip chip-gold">{m.leaderboard_you()}</span>
								{/if}
							</p>
							<div class="meter mt-1.5" aria-hidden="true">
								<div class="meter-fill" style="width: {(entry.total / maxTotal) * 100}%"></div>
							</div>
						</div>
						<span class="counter">
							<Coin class="size-5" />{formatPoints(entry.total)}
							<span class="sr-only">{m.board_pts({ score: formatPoints(entry.total) })}</span>
						</span>
					</li>
				{/each}
			</ol>
		{/if}
	{/if}
</div>

<style>
	.slot {
		display: flex;
		min-width: 0;
		flex-direction: column;
		align-items: center;
	}

	.slot :global(.crown) {
		position: absolute;
		top: -1.65rem;
		left: 50%;
		width: 2rem;
		height: 2rem;
		margin-left: -1rem;
		color: var(--color-gold-400);
		filter: drop-shadow(0 2px 0 var(--color-night-950));
		animation: bob 1.4s ease-in-out infinite;
	}

	/* The podium steps themselves */
	.step {
		--top: #e2e8f0;
		--bottom: #94a3b8;
		--edge: #64748b;
		display: grid;
		place-items: start center;
		width: 100%;
		margin-top: 0.6rem;
		padding-top: 0.5rem;
		border-radius: 1rem 1rem 0.4rem 0.4rem;
		border: 3px solid var(--color-night-950);
		background: linear-gradient(180deg, var(--top), var(--bottom));
		box-shadow:
			inset 0 3px 0 rgb(255 255 255 / 0.5),
			inset 0 -5px 0 var(--edge),
			0 4px 0 var(--color-night-950);
		font-size: 2rem;
		line-height: 1;
		color: white;
	}
	.rank-1 {
		--top: var(--color-gold-300);
		--bottom: var(--color-gold-500);
		--edge: var(--color-gold-600);
		height: 7.5rem;
		font-size: 2.6rem;
	}
	.rank-2 {
		height: 5.5rem;
	}
	.rank-3 {
		--top: #f6b98a;
		--bottom: #cd7a3c;
		--edge: #8f4c1d;
		height: 4.25rem;
	}

	.rank {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 2rem;
		font-size: 1.35rem;
		color: var(--color-night-200);
	}
</style>
