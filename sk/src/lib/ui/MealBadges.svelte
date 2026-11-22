<script lang="ts">
	import { ChefHat, Clock } from '@lucide/svelte';
	import { DIFFICULTY_LABELS } from '$lib/mealUi';
	import { difficultyLevel, formatPrepTime, type Meal } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';

	/**
	 * A dish's difficulty (1 to 3 chef hats) and preparation time chips.
	 * `compact` drops the difficulty's word (kept for screen readers), for
	 * the planner's narrow tiles.
	 */
	let { meal, compact = false }: { meal: Pick<Meal, 'difficulty' | 'prep_minutes'>; compact?: boolean } = $props();

	const level = $derived(difficultyLevel(meal.difficulty));
	const time = $derived(formatPrepTime(meal.prep_minutes));
	const label = $derived(DIFFICULTY_LABELS[meal.difficulty]());
</script>

<span class="flex flex-wrap items-center gap-1.5">
	<span class="chip chip-{meal.difficulty}" title={label}>
		<span class="flex" aria-hidden="true">
			{#each [1, 2, 3] as pip (pip)}
				<ChefHat class="size-3 {pip > level ? 'opacity-35' : ''}" strokeWidth={3} />
			{/each}
		</span>
		<span class={compact ? 'sr-only' : ''}>{label}</span>
	</span>
	{#if time}
		<span class="chip" title={m.meal_form_time()}><Clock class="size-3" strokeWidth={3} />{time}</span>
	{/if}
</span>
