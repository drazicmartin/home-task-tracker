<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Dialog } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { Check, Copy, Flame, Minus, Pencil, Plus, Sparkles, Swords } from '@lucide/svelte';
	import { questStatus, urgencyHue, type QuestStatus } from '$lib/scoring';
	import { formatPoints } from '$lib/game';
	import * as m from '$lib/paraglide/messages.js';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Coin from '$lib/ui/Coin.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import RewardBurst from '$lib/ui/RewardBurst.svelte';
	import type { ActionData, PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let dialogOpen = $state(false);
	let selectedTask = $state<PageData['tasks'][number] | null>(null);
	let selectedUserIds = $state<string[]>([]);
	let score = $state(0);
	let submitting = $state(false);
	let burst = $state<{ id: number; points: string } | null>(null);
	let burstTimer: ReturnType<typeof setTimeout> | undefined;

	const statusLabels: Record<QuestStatus, () => string> = {
		ok: m.dashboard_health_ok,
		dueSoon: m.dashboard_health_due_soon,
		overdue: m.dashboard_health_overdue
	};
	const unitLabels: Record<string, () => string> = {
		day: m.unit_day,
		week: m.unit_week,
		month: m.unit_month,
		year: m.unit_year
	};

	const overdueCount = $derived(data.tasks.filter((t) => questStatus(t.todoPercentage) === 'overdue').length);
	// Mirrors the server's split in the task_done action, as a preview.
	const splitScore = $derived(
		selectedUserIds.length > 1 ? formatPoints(Math.round((score / selectedUserIds.length) * 100) / 100) : null
	);

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

	function celebrate(points: number) {
		clearTimeout(burstTimer);
		burst = { id: Date.now(), points: formatPoints(points) };
		burstTimer = setTimeout(() => (burst = null), 2000);
		navigator.vibrate?.([25, 40, 25]);
	}

	const submitResult: SubmitFunction = () => {
		submitting = true;
		const claimed = score;
		return async ({ result, update }) => {
			submitting = false;
			const data = result.type === 'success' || result.type === 'failure' ? (result.data as ActionData) : undefined;
			if (result.type === 'failure' || result.type === 'error') {
				toast.error(data?.message ?? m.generic_error());
			} else {
				toast.success(data?.message ?? m.generic_saved());
				dialogOpen = false;
				celebrate(claimed);
			}
			await update();
		};
	};
</script>

<div class="flex flex-col gap-4">
	<PageHeader title={m.board_title()} eyebrow={data.activeHousehold?.name} icon={Swords}>
		{#snippet actions()}
			<a href="/board/tasks/new" class="btn btn-gold btn-sm" aria-label={m.board_new_task()}>
				<Plus class="size-5" strokeWidth={3.5} />
				<span class="hidden sm:inline">{m.board_new_task()}</span>
			</a>
		{/snippet}
	</PageHeader>

	{#if data.tasks.length === 0}
		<EmptyState icon={Swords} message={m.board_empty()}>
			<a href="/board/tasks/new" class="btn btn-gold">
				<Plus class="size-5" strokeWidth={3.5} />
				{m.board_new_task()}
			</a>
		</EmptyState>
	{:else}
		<div>
			{#if overdueCount > 0}
				<span class="chip chip-overdue"><Flame class="size-3.5" strokeWidth={3} />{m.board_overdue_count({ count: overdueCount })}</span>
			{:else}
				<span class="chip chip-ok"><Check class="size-3.5" strokeWidth={3.5} />{m.board_all_clear()}</span>
			{/if}
		</div>

		<!-- one column on phones; cards need ~340px, so two columns only from md -->
		<ul class="grid grid-cols-1 gap-3 md:grid-cols-2">
			{#each data.tasks as task, i (task.id)}
				{@const status = questStatus(task.todoPercentage)}
				<li
					class="quest animate-rise"
					data-status={status}
					style="--hue: {urgencyHue(task.todoPercentage)}; animation-delay: {Math.min(i, 12) * 35}ms"
				>
					<button type="button" class="quest-main" onclick={() => openTask(task)}>
						<span class="quest-emblem text-outline font-display" aria-hidden="true">
							{[...task.name.trim()][0]?.toUpperCase() ?? '?'}
							{#if status === 'overdue'}
								<span class="quest-alert">!</span>
							{/if}
						</span>

						<span class="flex min-w-0 flex-1 flex-col gap-1.5">
							<span class="quest-name">{task.name}</span>
							<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
								<span class="chip chip-{status}">{statusLabels[status]()}</span>
								<span class="text-xs font-extrabold text-night-300">
									{m.board_recurrence({ frequency: task.frequency, unit: unitLabels[task.unit]?.() ?? task.unit })}
								</span>
							</span>
							<span class="meter mt-0.5 {status === 'overdue' ? 'meter-striped' : ''}" aria-hidden="true">
								<span class="meter-fill" style="width: {Math.min(100, Math.max(0, task.todoPercentage))}%"></span>
							</span>
						</span>

						<span class="flex shrink-0 flex-col items-center gap-0.5 pl-1">
							<Coin class="size-8" />
							<span class="text-outline font-display text-xl leading-none text-gold-200" aria-hidden="true">
								{task.score}
							</span>
							<span class="sr-only">{m.board_pts({ score: task.score })}</span>
						</span>
					</button>

					<span class="quest-tools">
						<a href="/board/tasks/{task.id}/edit" class="quest-tool" aria-label={m.board_edit_aria({ name: task.name })}>
							<Pencil class="size-4" strokeWidth={3} />
						</a>
						<a
							href="/board/tasks/{task.id}/duplicate"
							class="quest-tool"
							aria-label={m.board_duplicate_aria({ name: task.name })}
						>
							<Copy class="size-4" strokeWidth={3} />
						</a>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

{#if burst}
	{#key burst.id}
		<RewardBurst points={burst.points} label={m.board_dialog_ribbon()} />
	{/key}
{/if}

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="overlay" />
		<Dialog.Content class="panel sheet">
			{#if selectedTask}
				<div class="flex flex-col items-center gap-3 text-center">
					<span class="ribbon"><Sparkles class="size-4" strokeWidth={3} />{m.board_dialog_ribbon()}</span>
					<Dialog.Title class="text-outline font-display text-2xl leading-tight break-words text-white">
						{selectedTask.name}
					</Dialog.Title>
				</div>

				<form method="post" action="?/task_done" use:enhance={submitResult} class="mt-5 flex flex-col gap-5">
					<input type="hidden" name="task_id" value={selectedTask.id} />
					<input type="hidden" name="score" value={score} />

					<fieldset>
						<legend class="field-label mb-2.5">{m.board_dialog_who()}</legend>
						<div class="grid grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] gap-2.5">
							{#each data.members as member (member.id)}
								{@const selected = selectedUserIds.includes(member.id)}
								<label class="hero" data-selected={selected}>
									<input
										type="checkbox"
										class="sr-only"
										checked={selected}
										onchange={() => toggleMember(member.id)}
									/>
									{#if selected}
										<input type="hidden" name="user_ids" value={member.id} />
										<input type="hidden" name="user_names" value={member.name || member.email} />
									{/if}
									<Avatar name={member.name || member.email} seed={member.id} class="size-12 text-lg" />
									<span class="hero-name">{member.name || member.email}</span>
									<span class="hero-check" aria-hidden="true"><Check class="size-3.5" strokeWidth={4} /></span>
								</label>
							{/each}
						</div>
					</fieldset>

					<div class="panel-inset flex flex-col items-center gap-2 px-3 py-3">
						<span class="field-label">{m.board_dialog_reward()}</span>
						<div class="flex items-center gap-4">
							<button
								type="button"
								onclick={() => adjustScore(-1)}
								disabled={score <= 0}
								aria-label={m.board_score_down()}
								class="btn btn-icon btn-red"
							>
								<Minus class="size-5" strokeWidth={4} />
							</button>
							<span class="flex min-w-24 items-center justify-center gap-1.5">
								<Coin class="size-9" />
								<span class="text-outline font-display text-4xl text-gold-200 tabular-nums" aria-live="polite">
									{score}
								</span>
							</span>
							<button
								type="button"
								onclick={() => adjustScore(1)}
								disabled={score >= selectedTask.score + 2}
								aria-label={m.board_score_up()}
								class="btn btn-icon btn-green"
							>
								<Plus class="size-5" strokeWidth={4} />
							</button>
						</div>
						{#if splitScore}
							<p class="text-sm font-extrabold text-night-200">{m.board_split_each({ score: splitScore })}</p>
						{/if}
					</div>

					<div class="grid grid-cols-[auto_1fr] gap-3">
						<Dialog.Close type="button" class="btn">{m.board_cancel()}</Dialog.Close>
						<button
							type="submit"
							disabled={selectedUserIds.length === 0 || submitting}
							class="btn btn-green shine"
						>
							<Check class="size-5" strokeWidth={4} />
							{m.board_validate()}
						</button>
					</div>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* Quest card: the whole left part is the "complete" button, the narrow
	 * right column is the edit link. Tinted from the left by urgency hue. */
	.quest {
		position: relative;
		display: flex;
		min-width: 0;
		align-items: stretch;
		border-radius: 1.25rem;
		border: 3px solid var(--color-night-950);
		background:
			linear-gradient(100deg, hsl(var(--hue) 75% 45% / 0.38), transparent 55%),
			linear-gradient(180deg, var(--color-night-700), var(--color-night-800));
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.12),
			inset 0 -3px 0 rgb(0 0 0 / 0.25),
			0 4px 0 var(--color-night-950);
		transition:
			transform 80ms ease-out,
			box-shadow 80ms ease-out;
	}
	.quest:has(.quest-main:active) {
		transform: translateY(3px);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.12),
			inset 0 -3px 0 rgb(0 0 0 / 0.25),
			0 1px 0 var(--color-night-950);
	}
	/* Overdue quests pulse a red ring to draw the eye. */
	.quest[data-status='overdue']::after {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: inherit;
		pointer-events: none;
		animation: ring 1.6s ease-out infinite;
	}
	@keyframes ring {
		from {
			box-shadow: 0 0 0 0 rgb(244 63 94 / 0.6);
		}
		to {
			box-shadow: 0 0 0 8px rgb(244 63 94 / 0);
		}
	}

	.quest-main {
		display: flex;
		flex: 1;
		min-width: 0;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 0.6rem 0.85rem 0.85rem;
		border-radius: 1.05rem 0 0 1.05rem;
		text-align: left;
		cursor: pointer;
	}
	.quest-main:hover .quest-emblem {
		transform: rotate(-6deg) scale(1.05);
	}
	.quest-main:focus-visible {
		outline-offset: -3px;
	}

	.quest-emblem {
		position: relative;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 1rem;
		border: 3px solid var(--color-night-950);
		background: linear-gradient(180deg, hsl(var(--hue) 80% 60%), hsl(var(--hue) 70% 38%));
		font-size: 1.6rem;
		line-height: 1;
		color: white;
		box-shadow:
			inset 0 3px 0 rgb(255 255 255 / 0.35),
			inset 0 -4px 0 hsl(var(--hue) 70% 24%),
			0 3px 0 var(--color-night-950);
		transition: transform 0.2s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.quest-alert {
		position: absolute;
		top: -0.65rem;
		right: -0.65rem;
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: var(--color-gold-400);
		color: var(--color-gold-900);
		font-size: 1rem;
		text-shadow: none;
		animation: bob 0.9s ease-in-out infinite;
	}

	.quest-name {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-family: var(--font-display);
		font-size: 1.15rem;
		line-height: 1.15;
		color: white;
		overflow-wrap: anywhere;
	}

	.quest .meter-fill {
		--fill: linear-gradient(90deg, hsl(var(--hue) 80% 42%), hsl(var(--hue) 90% 58%));
	}

	/* Right column: edit (top) and duplicate (bottom) stacked. */
	.quest-tools {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		width: 3rem;
		border-left: 3px solid var(--color-night-950);
		border-radius: 0 1.05rem 1.05rem 0;
		overflow: hidden;
		background: rgb(11 7 32 / 0.3);
	}
	.quest-tool {
		display: grid;
		flex: 1;
		place-items: center;
		color: var(--color-night-300);
		transition:
			color 0.15s,
			background 0.15s;
	}
	.quest-tool + .quest-tool {
		border-top: 3px solid var(--color-night-950);
	}
	.quest-tool:hover {
		color: white;
		background: rgb(11 7 32 / 0.5);
	}
	.quest-tool:focus-visible {
		outline-offset: -3px;
	}

	/* Small phones (e.g. 320px wide): tighten the card so the status chip and
	 * reward still fit next to each other. */
	@media (max-width: 359px) {
		.quest-main {
			gap: 0.7rem;
			padding: 0.75rem 0.5rem 0.75rem 0.7rem;
		}
		.quest-emblem {
			width: 2.75rem;
			height: 2.75rem;
			font-size: 1.35rem;
		}
		.quest-name {
			font-size: 1.05rem;
		}
		.quest-tools {
			width: 2.6rem;
		}
	}

	/* Party picker tiles in the completion sheet */
	.hero {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.45rem;
		padding: 0.8rem 0.4rem 0.65rem;
		border-radius: 1rem;
		border: 3px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.4);
		cursor: pointer;
		user-select: none;
		transition:
			transform 0.15s cubic-bezier(0.2, 1.5, 0.4, 1),
			background 0.15s,
			border-color 0.15s;
	}
	.hero:hover {
		background: rgb(11 7 32 / 0.6);
	}
	.hero:has(input:focus-visible) {
		outline: 3px solid var(--color-gold-300);
		outline-offset: 2px;
	}
	.hero[data-selected='true'] {
		transform: translateY(-3px);
		border-color: #4fdc83;
		background: linear-gradient(180deg, rgb(79 220 131 / 0.32), rgb(23 154 72 / 0.32));
		box-shadow: 0 4px 0 var(--color-night-950);
	}
	.hero-name {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.85rem;
		font-weight: 900;
	}
	.hero-check {
		position: absolute;
		top: -0.55rem;
		right: -0.55rem;
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: #4fdc83;
		color: var(--color-night-950);
		transform: scale(0);
		transition: transform 0.2s cubic-bezier(0.2, 1.6, 0.4, 1);
	}
	.hero[data-selected='true'] .hero-check {
		transform: scale(1);
	}
</style>
