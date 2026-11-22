<script lang="ts">
	import { ChevronLeft, Plus } from '@lucide/svelte';
	import MealForm from '$lib/MealForm.svelte';
	import { SLOT_LABELS, dayLabel } from '$lib/mealUi';
	import { weekStart } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const locale = getLocale();
	const backHref = $derived(data.planFor ? `/meals?week=${weekStart(data.planFor.day)}` : '/meals/library');
	const hidden = $derived<Record<string, string>>(data.planFor ? { day: data.planFor.day, slot: data.planFor.slot } : {});
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<a href={backHref} class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{data.planFor ? m.meals_back_to_plan() : m.meals_back_to_library()}
	</a>
	<PageHeader
		title={m.meal_new_title()}
		eyebrow={data.planFor ? m.meal_new_for({ day: dayLabel(data.planFor.day, locale), slot: SLOT_LABELS[data.planFor.slot]() }) : undefined}
		icon={Plus}
	/>

	<section class="panel p-4 sm:p-5">
		<MealForm
			action="?/create"
			initial={form?.name !== undefined
				? { name: form.name, difficulty: form.difficulty, prep_minutes: form.prep_minutes }
				: { name: data.name, difficulty: 'easy', prep_minutes: 30 }}
			error={form?.message}
			{hidden}
			autofocus={!data.name}
			submitLabel={data.planFor ? m.meal_new_create_and_plan() : m.meal_new_create()}
		/>
	</section>
</div>
