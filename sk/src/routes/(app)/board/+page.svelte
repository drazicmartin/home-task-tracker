<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Dialog } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { urgencyGradient } from '$lib/scoring';
	import type { ActionData, PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let dialogOpen = $state(false);
	let selectedTask = $state<PageData['tasks'][number] | null>(null);
	let selectedUserIds = $state<string[]>([]);
	let score = $state(0);

	function openTask(task: PageData['tasks'][number]) {
		selectedTask = task;
		selectedUserIds = [];
		score = task.score;
		dialogOpen = true;
	}

	function toggleMember(userId: string) {
		selectedUserIds = selectedUserIds.includes(userId)
			? selectedUserIds.filter((id) => id !== userId)
			: [...selectedUserIds, userId];
	}

	function adjustScore(delta: number) {
		if (!selectedTask) return;
		score = Math.min(Math.max(score + delta, 0), selectedTask.score + 2);
	}

	const submitResult: SubmitFunction = () => {
		return async ({ result, update }) => {
			const data = result.type === 'success' || result.type === 'failure' ? (result.data as ActionData) : undefined;
			if (result.type === 'failure' || result.type === 'error') {
				toast.error(data?.message ?? 'Une erreur est survenue.');
			} else {
				toast.success(data?.message ?? 'Enregistré !');
				dialogOpen = false;
			}
			await update();
		};
	};
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold text-stone-900">Tâches</h1>
		<a
			href="/board/tasks/new"
			class="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium hover:bg-stone-100"
		>
			+ Nouvelle tâche
		</a>
	</div>

	{#if data.tasks.length === 0}
		<div class="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
			Aucune tâche pour l'instant. Créez-en une pour commencer à gagner des points !
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each data.tasks as task (task.id)}
				<div class="relative">
					<a
						href="/board/tasks/{task.id}/edit"
						class="absolute top-2 right-2 z-10 rounded-full bg-black/20 px-2 py-1 text-xs text-white backdrop-blur hover:bg-black/40"
						aria-label="Modifier {task.name}"
					>
						✎
					</a>
					<button
						type="button"
						onclick={() => openTask(task)}
						style="background: {urgencyGradient(task.todoPercentage)}"
						class="flex h-32 w-full flex-col justify-between rounded-2xl p-4 text-left text-white shadow-sm transition hover:brightness-110"
					>
						<span class="text-lg leading-tight font-semibold break-words">{task.name}</span>
						<span class="text-2xl font-bold">{task.score} pts</span>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/40" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
		>
			{#if selectedTask}
				<Dialog.Title class="text-lg font-semibold text-stone-900">
					Qui a fait « {selectedTask.name} » ?
				</Dialog.Title>

				<form
					method="post"
					action="?/task_done"
					use:enhance={submitResult}
					class="mt-4 flex flex-col gap-4"
				>
					<input type="hidden" name="task_id" value={selectedTask.id} />
					<input type="hidden" name="score" value={score} />

					<div class="flex flex-col gap-2">
						{#each data.members as member (member.id)}
							<label class="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 hover:bg-stone-50">
								<input
									type="checkbox"
									checked={selectedUserIds.includes(member.id)}
									onchange={() => toggleMember(member.id)}
									class="h-4 w-4"
								/>
								{#if selectedUserIds.includes(member.id)}
									<input type="hidden" name="user_ids" value={member.id} />
									<input type="hidden" name="user_names" value={member.name || member.email} />
								{/if}
								<span class="text-stone-800">{member.name || member.email}</span>
							</label>
						{/each}
					</div>

					<div class="flex items-center justify-center gap-4">
						<button
							type="button"
							onclick={() => adjustScore(-1)}
							class="h-9 w-9 rounded-full border border-stone-300 font-semibold hover:bg-stone-100"
						>
							-1
						</button>
						<span class="text-xl font-bold text-stone-900">{score} pts</span>
						<button
							type="button"
							onclick={() => adjustScore(1)}
							class="h-9 w-9 rounded-full border border-stone-300 font-semibold hover:bg-stone-100"
						>
							+1
						</button>
					</div>

					<div class="flex justify-end gap-2">
						<Dialog.Close
							type="button"
							class="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100"
						>
							Annuler
						</Dialog.Close>
						<button
							type="submit"
							disabled={selectedUserIds.length === 0}
							class="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
						>
							Valider
						</button>
					</div>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
