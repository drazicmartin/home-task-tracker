<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const windows = [
		{ value: 'week', label: 'Cette semaine' },
		{ value: 'month', label: 'Ce mois' },
		{ value: 'all', label: 'Depuis toujours' }
	];

	let maxTotal = $derived(Math.max(1, ...data.ranking.map((r) => r.total)));
	const medals = ['🥇', '🥈', '🥉'];
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold text-stone-900">Classement</h1>
		<div class="flex gap-1">
			{#each windows as w (w.value)}
				<a
					href="?window={w.value}"
					class="rounded-full px-3 py-1.5 text-sm font-medium transition {data.window === w.value
						? 'bg-stone-900 text-white'
						: 'text-stone-600 hover:bg-stone-100'}"
				>
					{w.label}
				</a>
			{/each}
		</div>
	</div>

	{#if data.ranking.length === 0}
		<div class="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
			Aucun point marqué sur cette période.
		</div>
	{:else}
		<ol class="flex flex-col gap-3">
			{#each data.ranking as entry, i (entry.id)}
				<li class="rounded-2xl border border-stone-200 bg-white p-4">
					<div class="flex items-center justify-between">
						<span class="flex items-center gap-2 font-medium text-stone-900">
							<span class="w-6 text-center">{medals[i] ?? i + 1}</span>
							{entry.name}
						</span>
						<span class="font-bold text-stone-900">{entry.total} pts</span>
					</div>
					<div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
						<div
							class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
							style="width: {(entry.total / maxTotal) * 100}%"
						></div>
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</div>
