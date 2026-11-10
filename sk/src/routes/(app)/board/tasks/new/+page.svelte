<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, ChevronLeft, Clock, Library, PenLine, Plus, TriangleAlert } from '@lucide/svelte';
	import TaskForm from '$lib/TaskForm.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { QUEST_CATALOG, QUEST_CATEGORIES, localize, questScore, type QuestCategory } from '$lib/questCatalog';
	import Coin from '$lib/ui/Coin.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const locale = getLocale();

	let selected = $state<string[]>([]);
	let submitting = $state(false);

	const categoryLabels: Record<QuestCategory, () => string> = {
		kitchen: m.catalog_cat_kitchen,
		floors: m.catalog_cat_floors,
		bathroom: m.catalog_cat_bathroom,
		laundry: m.catalog_cat_laundry,
		pets: m.catalog_cat_pets,
		outdoor: m.catalog_cat_outdoor,
		errands: m.catalog_cat_errands
	};
	const unitLabels: Record<string, () => string> = {
		day: m.unit_day,
		week: m.unit_week,
		month: m.unit_month,
		year: m.unit_year
	};

	const existing = $derived(new Set(data.existingNames));
	const groups = $derived(
		QUEST_CATEGORIES.map((category) => ({
			category,
			quests: QUEST_CATALOG.filter((q) => q.category === category).map((q) => ({
				...q,
				label: localize(q.name, locale),
				text: localize(q.description, locale),
				score: questScore(q),
				alreadyAdded: existing.has(localize(q.name, locale).toLowerCase())
			}))
		}))
	);
	const selectedPoints = $derived(
		QUEST_CATALOG.filter((q) => selected.includes(q.id)).reduce((sum, q) => sum + questScore(q), 0)
	);
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-4">
	<a href="/board" class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{m.back_to_board()}
	</a>
	<PageHeader title={m.task_new_title()} icon={Plus} />

	<!-- Built-in catalogue: tick several chores and add them in one go -->
	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><Library class="size-5" strokeWidth={3} />{m.task_new_catalog_heading()}</h2>
		<p class="mt-1.5 text-sm font-bold text-night-200">{m.task_new_catalog_hint()}</p>

		<form
			method="post"
			action="?/catalog"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
			class="mt-3 flex flex-col gap-4"
		>
			{#if form?.catalogMessage}
				<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.catalogMessage}</p>
			{/if}

			{#each groups as group (group.category)}
				<fieldset class="flex flex-col gap-2">
					<legend class="field-label mb-2">{categoryLabels[group.category]()}</legend>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each group.quests as quest (quest.id)}
							<label
								class="panel-inset flex cursor-pointer gap-3 p-3 has-checked:border-gold-400 has-checked:bg-gold-500/10 has-disabled:cursor-not-allowed has-disabled:opacity-50"
							>
								<input
									type="checkbox"
									name="quest"
									value={quest.id}
									bind:group={selected}
									disabled={quest.alreadyAdded}
									class="peer sr-only"
								/>
								<span
									class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-[3px] border-night-950 bg-night-900 text-transparent peer-checked:bg-gold-400 peer-checked:text-gold-900 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300"
									aria-hidden="true"
								>
									<Check class="size-4" strokeWidth={4} />
								</span>
								<span class="flex min-w-0 flex-1 flex-col gap-1">
									<span class="flex items-start justify-between gap-2">
										<span class="font-display text-[1.05rem] leading-tight text-white">{quest.label}</span>
										<span class="flex shrink-0 items-center gap-1 font-display text-gold-200">
											<Coin class="size-5" />{quest.score}
										</span>
									</span>
									<span class="text-sm leading-snug font-semibold text-night-200">{quest.text}</span>
									<span class="flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-night-300">
										<span>{m.board_recurrence({ frequency: quest.frequency, unit: unitLabels[quest.unit]() })}</span>
										<span aria-hidden="true">·</span>
										<span class="inline-flex items-center gap-1"
											><Clock class="size-3" strokeWidth={3} />{m.task_new_catalog_minutes({ minutes: quest.minutes })}</span
										>
										{#if quest.alreadyAdded}
											<span class="chip chip-ok">{m.task_new_catalog_already()}</span>
										{/if}
									</span>
								</span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/each}

			<div class="sticky bottom-[calc(6.5rem_+_env(safe-area-inset-bottom))] z-10">
				<button type="submit" disabled={selected.length === 0 || submitting} class="btn btn-gold btn-block shine">
					<Plus class="size-5" strokeWidth={3.5} />
					{m.task_new_catalog_add({ count: selected.length })}
					{#if selected.length > 0}
						<span class="flex items-center gap-1 opacity-80"><Coin class="size-5" />{selectedPoints}</span>
					{/if}
				</button>
			</div>
		</form>
	</section>

	<!-- Fully custom quest -->
	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading mb-3"><PenLine class="size-5" strokeWidth={3} />{m.task_new_custom_heading()}</h2>
		<TaskForm
			action="?/create"
			initial={typeof form?.name === 'string'
				? {
						name: form.name,
						description: form.description ?? '',
						frequency: form.frequency ?? 1,
						unit: form.unit ?? 'week',
						score: form.score ?? 1
					}
				: undefined}
			error={form?.message}
			submitLabel={m.task_new_create()}
		/>
	</section>
</div>
