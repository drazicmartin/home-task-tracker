<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Dialog } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { Check, ChefHat, Clock, LoaderCircle, Plus, Search, SearchX, UtensilsCrossed, X } from '@lucide/svelte';
	import { DIFFICULTY_LABELS, SLOT_ICONS, SLOT_LABELS, dayLabel } from '$lib/mealUi';
	import { MEAL_DIFFICULTIES, PREP_TIME_PRESETS, type Meal, type MealDifficulty, type MealSlot } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { matchesWords, searchWords } from '$lib/search';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import MealBadges from '$lib/ui/MealBadges.svelte';
	import MealPhoto from '$lib/ui/MealPhoto.svelte';

	/**
	 * Bottom sheet to choose the dish for one day's lunch or dinner: a text
	 * search over the household's dishes, difficulty / max time filters, and
	 * a shortcut to create the dish that was searched for when it's missing.
	 * Choosing posts the page's ?/assign action.
	 */
	let {
		open = $bindable(false),
		target,
		meals,
		currentMealId
	}: {
		open: boolean;
		target: { day: string; slot: MealSlot } | null;
		meals: Meal[];
		currentMealId?: string;
	} = $props();

	const locale = getLocale();
	const TIME_FILTERS = PREP_TIME_PRESETS.slice(0, 4);

	let query = $state('');
	let difficulties = $state<MealDifficulty[]>([]);
	let maxMinutes = $state<number | null>(null);
	let submitting = $state<string | null>(null);

	// every opening starts from a clean search
	$effect.pre(() => {
		if (open) {
			query = '';
			difficulties = [];
			maxMinutes = null;
		}
	});

	const words = $derived(searchWords(query));
	const filtering = $derived(words.length > 0 || difficulties.length > 0 || maxMinutes !== null);
	const visible = $derived(
		meals.filter(
			(meal) =>
				matchesWords(meal.name, words) &&
				(difficulties.length === 0 || difficulties.includes(meal.difficulty)) &&
				(maxMinutes === null || (meal.prep_minutes > 0 && meal.prep_minutes <= maxMinutes))
		)
	);
	const createHref = $derived.by(() => {
		const params = new URLSearchParams();
		if (target) {
			params.set('day', target.day);
			params.set('slot', target.slot);
		}
		if (query.trim()) params.set('name', query.trim());
		return `/meals/new?${params}`;
	});
	const SlotIcon = $derived(target ? SLOT_ICONS[target.slot] : UtensilsCrossed);

	function toggleDifficulty(difficulty: MealDifficulty) {
		difficulties = difficulties.includes(difficulty)
			? difficulties.filter((d) => d !== difficulty)
			: [...difficulties, difficulty];
	}

	const submitAssign: SubmitFunction = ({ submitter }) => {
		const mealId = submitter instanceof HTMLButtonElement ? submitter.value : '';
		const name = meals.find((meal) => meal.id === mealId)?.name ?? '';
		submitting = mealId;
		return async ({ result, update }) => {
			if (result.type === 'success') open = false;
			// the toast comes once the planner shows the new dish
			await update();
			submitting = null;
			if (result.type === 'success') {
				toast.success(m.meals_assigned({ name }));
			} else {
				const message = result.type === 'failure' ? (result.data?.message as string | undefined) : undefined;
				toast.error(message ?? m.generic_error());
			}
		};
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="overlay" />
		<Dialog.Content class="panel sheet flex h-[min(44rem,calc(100dvh-2rem))] flex-col gap-3 overflow-hidden sm:w-[min(30rem,calc(100vw-2rem))]">
			{#if target}
				<div class="flex flex-col items-center gap-1 text-center">
					<Dialog.Title class="ribbon">
						<SlotIcon class="size-4" strokeWidth={3} />{SLOT_LABELS[target.slot]()}
					</Dialog.Title>
					<Dialog.Description class="mt-1.5 font-display text-lg text-white">
						{dayLabel(target.day, locale)}
					</Dialog.Description>
				</div>

				<div class="relative">
					<Search class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-night-300" strokeWidth={3} />
					<input
						bind:value={query}
						type="search"
						aria-label={m.meals_picker_search_label()}
						placeholder={m.meals_picker_search()}
						enterkeyhint="search"
						autocomplete="off"
						class="input pr-10 pl-10"
					/>
					{#if query}
						<button
							type="button"
							onclick={() => (query = '')}
							class="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-night-300 hover:text-white"
							aria-label={m.filter_search_clear()}
						>
							<X class="size-4" strokeWidth={3.5} />
						</button>
					{/if}
				</div>

				{#if meals.length > 0}
					<div class="filters -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
						{#each MEAL_DIFFICULTIES as difficulty (difficulty)}
							<button
								type="button"
								class="pill"
								aria-pressed={difficulties.includes(difficulty)}
								onclick={() => toggleDifficulty(difficulty)}
							>
								<ChefHat class="size-3.5" strokeWidth={3} />{DIFFICULTY_LABELS[difficulty]()}
							</button>
						{/each}
						<span class="mx-0.5 w-0.5 shrink-0 rounded-full bg-night-950/70" aria-hidden="true"></span>
						{#each TIME_FILTERS as minutes (minutes)}
							<button
								type="button"
								class="pill"
								aria-pressed={maxMinutes === minutes}
								aria-label={m.meals_filter_time_max_aria({ minutes })}
								onclick={() => (maxMinutes = maxMinutes === minutes ? null : minutes)}
							>
								<Clock class="size-3.5" strokeWidth={3} />{m.meals_filter_time_max({ minutes })}
							</button>
						{/each}
					</div>
				{/if}

				<div class="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
					{#if meals.length === 0}
						<EmptyState icon={UtensilsCrossed} message={m.meals_empty()} />
					{:else if visible.length === 0}
						<EmptyState icon={SearchX} message={m.meals_picker_no_match()}>
							{#if filtering && (difficulties.length > 0 || maxMinutes !== null)}
								<button
									type="button"
									class="btn btn-sm"
									onclick={() => {
										difficulties = [];
										maxMinutes = null;
									}}>{m.filter_reset()}</button
								>
							{/if}
						</EmptyState>
					{:else}
						<form method="post" action="?/assign" use:enhance={submitAssign}>
							<input type="hidden" name="day" value={target.day} />
							<input type="hidden" name="slot" value={target.slot} />
							<ul class="flex flex-col gap-2">
								{#each visible as meal (meal.id)}
									{@const current = meal.id === currentMealId}
									<li>
										<button
											type="submit"
											name="meal"
											value={meal.id}
											disabled={submitting !== null}
											aria-current={current ? 'true' : undefined}
											class="choice"
										>
											<MealPhoto {meal} class="size-14" />
											<span class="flex min-w-0 flex-1 flex-col gap-1 text-left">
												<span class="choice-name">{meal.name}</span>
												<MealBadges {meal} />
											</span>
											{#if submitting === meal.id}
												<LoaderCircle class="size-5 shrink-0 animate-spin text-gold-300" strokeWidth={3} />
											{:else if current}
												<span class="choice-check" title={m.meals_picker_current()}><Check class="size-4" strokeWidth={4} /></span>
											{/if}
										</button>
									</li>
								{/each}
							</ul>
						</form>
					{/if}
				</div>

				<div class="grid grid-cols-[auto_1fr] gap-2 border-t-2 border-night-950/60 pt-3">
					<Dialog.Close type="button" class="btn">{m.board_cancel()}</Dialog.Close>
					<a href={createHref} class="btn btn-green min-w-0">
						<Plus class="size-5 shrink-0" strokeWidth={3.5} />
						<span class="truncate">
							{query.trim() && visible.length === 0 ? m.meals_picker_create({ name: query.trim() }) : m.meals_new()}
						</span>
					</a>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.filters {
		scrollbar-width: none;
	}
	.filters::-webkit-scrollbar {
		display: none;
	}
	.pill {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.3rem;
		min-height: 2.25rem;
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		color: var(--color-night-100);
		font-size: 0.8rem;
		font-weight: 900;
		white-space: nowrap;
		cursor: pointer;
		transition: background 0.15s;
	}
	.pill:hover {
		background: rgb(11 7 32 / 0.7);
	}
	.pill[aria-pressed='true'] {
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		box-shadow: inset 0 -2px 0 var(--color-gold-600);
	}

	.choice {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem 0.5rem 0.5rem;
		border-radius: 1.1rem;
		border: 3px solid var(--color-night-950);
		background: linear-gradient(180deg, var(--color-night-600), var(--color-night-700));
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.1),
			0 3px 0 var(--color-night-950);
		cursor: pointer;
		transition:
			transform 80ms ease-out,
			box-shadow 80ms ease-out,
			filter 120ms;
	}
	.choice:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.choice:active:not(:disabled) {
		transform: translateY(2px);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.1),
			0 1px 0 var(--color-night-950);
	}
	.choice:disabled {
		cursor: progress;
	}
	.choice[aria-current='true'] {
		border-color: #4fdc83;
		background: linear-gradient(180deg, rgb(79 220 131 / 0.3), rgb(23 154 72 / 0.3));
	}
	.choice-name {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-family: var(--font-display);
		font-size: 1.05rem;
		line-height: 1.15;
		color: white;
		overflow-wrap: anywhere;
	}
	.choice-check {
		display: grid;
		flex-shrink: 0;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: #4fdc83;
		color: var(--color-night-950);
	}
</style>
