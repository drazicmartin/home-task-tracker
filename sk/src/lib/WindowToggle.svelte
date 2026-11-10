<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let { current }: { current: 'week' | 'month' | 'all' } = $props();

	const windows = [
		{ value: 'week', label: m.leaderboard_week() },
		{ value: 'month', label: m.leaderboard_month() },
		{ value: 'all', label: m.leaderboard_all() }
	];
</script>

<nav class="panel-inset grid grid-cols-3 gap-1 p-1">
	{#each windows as w (w.value)}
		<a href="?window={w.value}" class="segment" aria-current={current === w.value ? 'page' : undefined}>
			{w.label}
		</a>
	{/each}
</nav>

<style>
	.segment {
		display: grid;
		place-items: center;
		min-height: 2.6rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.75rem;
		border: 3px solid transparent;
		color: var(--color-night-200);
		font-size: 0.85rem;
		font-weight: 900;
		line-height: 1.1;
		text-align: center;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.segment:hover {
		color: white;
	}
	.segment[aria-current='page'] {
		border-color: var(--color-night-950);
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.5),
			inset 0 -3px 0 var(--color-gold-600);
	}
</style>
