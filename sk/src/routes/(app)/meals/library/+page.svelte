<script lang="ts">
	import { BookOpen, ChefHat, ChevronLeft, Plus, Search, SearchX, UtensilsCrossed, X } from '@lucide/svelte';
	import { DIFFICULTY_LABELS } from '$lib/mealUi';
	import { MEAL_DIFFICULTIES, type MealDifficulty } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';
	import { matchesWords, searchWords } from '$lib/search';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import MealBadges from '$lib/ui/MealBadges.svelte';
	import MealPhoto from '$lib/ui/MealPhoto.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let query = $state('');
	let difficulties = $state<MealDifficulty[]>([]);

	const words = $derived(searchWords(query));
	const visible = $derived(
		data.meals.filter(
			(meal) => matchesWords(meal.name, words) && (difficulties.length === 0 || difficulties.includes(meal.difficulty))
		)
	);

	function toggleDifficulty(difficulty: MealDifficulty) {
		difficulties = difficulties.includes(difficulty)
			? difficulties.filter((d) => d !== difficulty)
			: [...difficulties, difficulty];
	}
</script>

<div class="flex flex-col gap-4">
	<a href="/meals" class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{m.meals_back_to_plan()}
	</a>
	<PageHeader title={m.meals_library_title()} eyebrow={data.activeHousehold?.name} icon={BookOpen}>
		{#snippet actions()}
			<a href="/meals/new" class="btn btn-gold btn-sm" aria-label={m.meals_new()}>
				<Plus class="size-5" strokeWidth={3.5} />
				<span class="hidden sm:inline">{m.meals_new()}</span>
			</a>
		{/snippet}
	</PageHeader>

	{#if data.meals.length === 0}
		<EmptyState icon={UtensilsCrossed} message={m.meals_empty()}>
			<a href="/meals/new" class="btn btn-gold">
				<Plus class="size-5" strokeWidth={3.5} />{m.meals_new()}
			</a>
		</EmptyState>
	{:else}
		<div class="flex flex-col gap-2">
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
			<div class="flex flex-wrap items-center gap-1.5">
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
				<span class="ml-auto px-1 text-xs font-extrabold text-night-300" aria-live="polite">
					{visible.length === data.meals.length
						? m.meals_library_count({ count: data.meals.length })
						: m.meals_library_shown({ shown: visible.length, total: data.meals.length })}
				</span>
			</div>
		</div>

		{#if visible.length === 0}
			<EmptyState icon={SearchX} message={m.meals_picker_no_match()}>
				<a href="/meals/new?name={encodeURIComponent(query.trim())}" class="btn btn-green">
					<Plus class="size-5" strokeWidth={3.5} />
					{query.trim() ? m.meals_picker_create({ name: query.trim() }) : m.meals_new()}
				</a>
			</EmptyState>
		{/if}

		<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each visible as meal, i (meal.id)}
				<li class="animate-rise" style="animation-delay: {Math.min(i, 12) * 30}ms">
					<a href="/meals/{meal.id}/edit" class="card" aria-label={m.meals_edit_aria({ name: meal.name })}>
						<MealPhoto {meal} size="card" cover class="aspect-[4/3] w-full" />
						<span class="flex flex-1 flex-col gap-1.5 p-2.5">
							<span class="card-name">{meal.name}</span>
							<MealBadges {meal} />
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		min-height: 2.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		color: var(--color-night-100);
		font-size: 0.85rem;
		font-weight: 900;
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

	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border-radius: 1.1rem;
		border: 3px solid var(--color-night-950);
		background: linear-gradient(180deg, var(--color-night-700), var(--color-night-800));
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.12),
			0 4px 0 var(--color-night-950);
		transition:
			transform 80ms ease-out,
			box-shadow 80ms ease-out,
			filter 120ms;
	}
	.card:hover {
		filter: brightness(1.08);
	}
	.card:active {
		transform: translateY(3px);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.12),
			0 1px 0 var(--color-night-950);
	}
	.card-name {
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
</style>
