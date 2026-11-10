<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, ChevronLeft, ChevronRight, Pencil, ScrollText, Trash, TriangleAlert, X } from '@lucide/svelte';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPoints } from '$lib/game';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Coin from '$lib/ui/Coin.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
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
	<PageHeader title={m.history_title()} eyebrow={data.activeHousehold?.name} icon={ScrollText} />

	{#if form?.message}
		<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
	{/if}

	{#if data.items.length === 0}
		<EmptyState icon={ScrollText} message={m.history_empty()} />
	{:else}
		<ul class="flex flex-col gap-2.5">
			{#each data.items as item (item.id)}
				{@const userName = item.expand?.user?.name || item.expand?.user?.email || m.history_someone()}
				<li class="panel px-3 py-3">
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
							class="flex flex-col gap-3"
						>
							<input type="hidden" name="recordId" value={item.id} />
							<select name="task" class="input" aria-label={m.nav_tasks()}>
								{#each data.tasks as task (task.id)}
									<option value={task.id} selected={task.id === item.task}>{task.name}</option>
								{/each}
							</select>
							<div class="grid grid-cols-[1fr_7rem] gap-2">
								<select name="user" class="input min-w-0" aria-label={m.settings_members()}>
									{#each data.members as member (member.id)}
										<option value={member.id} selected={member.id === item.user}>{member.name}</option>
									{/each}
								</select>
								<input
									type="number"
									name="score"
									min="0"
									step="0.5"
									inputmode="decimal"
									value={item.score}
									class="input"
									aria-label={m.history_score()}
								/>
							</div>
							<div class="grid grid-cols-2 gap-2">
								<button type="button" onclick={cancelEdit} class="btn btn-sm">
									<X class="size-4" strokeWidth={3.5} />{m.history_cancel()}
								</button>
								<button type="submit" class="btn btn-sm btn-green">
									<Check class="size-4" strokeWidth={3.5} />{m.history_save()}
								</button>
							</div>
						</form>
					{:else}
						<div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
							<span class="row-span-2">
								<Avatar name={userName} seed={item.user} class="size-11 text-base" />
							</span>
							<p class="truncate font-display text-lg leading-tight text-white">
								{item.expand?.task?.name ?? m.history_deleted_task()}
							</p>
							<span class="flex items-center justify-end gap-1 font-display text-lg leading-none text-gold-200">
								+{formatPoints(item.score)}<Coin class="size-5" />
								<span class="sr-only">{m.board_pts({ score: formatPoints(item.score) })}</span>
							</span>
							<p class="truncate text-xs font-extrabold text-night-300">
								{userName} · {formatDate(item.created)}
							</p>
							<div class="flex justify-end gap-1.5">
								<button
									type="button"
									onclick={() => startEdit(item.id)}
									class="btn btn-icon btn-sm"
									aria-label={m.history_edit()}
									title={m.history_edit()}
								>
									<Pencil class="size-4" strokeWidth={3} />
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
									<button
										type="submit"
										class="btn btn-icon btn-sm btn-red"
										aria-label={m.history_delete()}
										title={m.history_delete()}
									>
										<Trash class="size-4" strokeWidth={3} />
									</button>
								</form>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if data.totalPages > 1}
			<nav class="flex items-center justify-between gap-2 pt-1">
				{#if data.page > 1}
					<a href="?page={data.page - 1}" class="btn btn-sm">
						<ChevronLeft class="size-4" strokeWidth={3.5} />{m.history_prev()}
					</a>
				{:else}
					<span></span>
				{/if}
				<span class="counter px-3 text-sm">{m.history_page({ page: data.page, totalPages: data.totalPages })}</span>
				{#if data.page < data.totalPages}
					<a href="?page={data.page + 1}" class="btn btn-sm">
						{m.history_next()}<ChevronRight class="size-4" strokeWidth={3.5} />
					</a>
				{:else}
					<span></span>
				{/if}
			</nav>
		{/if}
	{/if}
</div>
