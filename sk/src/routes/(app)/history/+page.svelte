<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('fr-FR', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-semibold text-stone-900">Historique</h1>

	{#if data.items.length === 0}
		<div class="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
			Aucune activité pour l'instant.
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.items as item (item.id)}
				<li class="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
					<div class="min-w-0">
						<p class="truncate font-medium text-stone-900">{item.expand?.task?.name ?? 'Tâche supprimée'}</p>
						<p class="truncate text-sm text-stone-500">
							{item.expand?.user?.name ?? 'Quelqu’un'} · {formatDate(item.created)}
						</p>
					</div>
					<span class="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
						+{item.score}
					</span>
				</li>
			{/each}
		</ul>

		{#if data.totalPages > 1}
			<div class="flex justify-center gap-2 pt-2">
				{#if data.page > 1}
					<a href="?page={data.page - 1}" class="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100">
						&larr; Précédent
					</a>
				{/if}
				<span class="px-2 py-1.5 text-sm text-stone-500">Page {data.page} / {data.totalPages}</span>
				{#if data.page < data.totalPages}
					<a href="?page={data.page + 1}" class="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100">
						Suivant &rarr;
					</a>
				{/if}
			</div>
		{/if}
	{/if}
</div>
