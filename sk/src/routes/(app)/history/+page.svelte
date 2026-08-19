<script lang="ts">
	import { enhance } from '$app/forms';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editingId = $state<string | null>(null);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(getLocale() === 'en' ? 'en-US' : 'fr-FR', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function startEdit(id: string) {
		editingId = id;
	}

	function cancelEdit() {
		editingId = null;
	}
</script>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-semibold text-stone-900">{m.history_title()}</h1>

	{#if form?.message}
		<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
	{/if}

	{#if data.items.length === 0}
		<div class="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
			{m.history_empty()}
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.items as item (item.id)}
				<li class="rounded-xl border border-stone-200 bg-white px-4 py-3">
					{#if editingId === item.id}
						<form
							method="post"
							action="?/update"
							use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'success') editingId = null;
									await update();
								};
							}}
							class="flex flex-col gap-2"
						>
							<input type="hidden" name="recordId" value={item.id} />
							<div class="flex flex-wrap gap-2">
								<select name="task" class="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm">
									{#each data.tasks as task (task.id)}
										<option value={task.id} selected={task.id === item.task}>{task.name}</option>
									{/each}
								</select>
								<select name="user" class="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm">
									{#each data.members as member (member.id)}
										<option value={member.id} selected={member.id === item.user}>{member.name}</option>
									{/each}
								</select>
								<input
									type="number"
									name="score"
									min="0"
									step="0.5"
									value={item.score}
									class="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm"
									aria-label={m.history_score()}
								/>
							</div>
							<div class="flex gap-2">
								<button type="submit" class="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-700">
									{m.history_save()}
								</button>
								<button type="button" onclick={cancelEdit} class="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100">
									{m.history_cancel()}
								</button>
							</div>
						</form>
					{:else}
						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate font-medium text-stone-900">{item.expand?.task?.name ?? m.history_deleted_task()}</p>
								<p class="truncate text-sm text-stone-500">
									{item.expand?.user?.name ?? m.history_someone()} · {formatDate(item.created)}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-3">
								<span class="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
									+{item.score}
								</span>
								<button type="button" onclick={() => startEdit(item.id)} class="text-sm text-stone-600 hover:underline">
									{m.history_edit()}
								</button>
								<form
									method="post"
									action="?/delete"
									use:enhance={({ cancel }) => {
										if (!confirm(m.history_delete_confirm())) {
											cancel();
										}
									}}
								>
									<input type="hidden" name="recordId" value={item.id} />
									<button type="submit" class="text-sm text-red-600 hover:underline">{m.history_delete()}</button>
								</form>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if data.totalPages > 1}
			<div class="flex justify-center gap-2 pt-2">
				{#if data.page > 1}
					<a href="?page={data.page - 1}" class="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100">
						{m.history_prev()}
					</a>
				{/if}
				<span class="px-2 py-1.5 text-sm text-stone-500">{m.history_page({ page: data.page, totalPages: data.totalPages })}</span>
				{#if data.page < data.totalPages}
					<a href="?page={data.page + 1}" class="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:bg-stone-100">
						{m.history_next()}
					</a>
				{/if}
			</div>
		{/if}
	{/if}
</div>
