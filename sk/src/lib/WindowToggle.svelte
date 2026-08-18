<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let { current }: { current: 'week' | 'month' | 'all' } = $props();

	const windows = [
		{ value: 'week', label: m.leaderboard_week() },
		{ value: 'month', label: m.leaderboard_month() },
		{ value: 'all', label: m.leaderboard_all() }
	];
</script>

<div class="flex gap-1">
	{#each windows as w (w.value)}
		<a
			href="?window={w.value}"
			class="rounded-full px-3 py-1.5 text-sm font-medium transition {current === w.value
				? 'bg-stone-900 text-white'
				: 'text-stone-600 hover:bg-stone-100'}"
		>
			{w.label}
		</a>
	{/each}
</div>
