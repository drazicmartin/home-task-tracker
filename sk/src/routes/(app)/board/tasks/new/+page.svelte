<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, ChevronLeft, Clock, Library, PenLine, Plus, TriangleAlert } from '@lucide/svelte';
	import TaskForm from '$lib/TaskForm.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { HOUSEHOLD_KINDS, householdKind, type HouseholdKind } from '$lib/householdKinds';
	import { CATEGORY_COLORS } from '$lib/questCategories';
	import { CATEGORY_ICONS, CATEGORY_LABELS, KIND_COLORS, KIND_ICONS, KIND_LABELS } from '$lib/kindUi';
	import { QUEST_CATALOG, catalogFor, localize, questScore } from '$lib/questCatalog';
	import Coin from '$lib/ui/Coin.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const locale = getLocale();

	let selected = $state<string[]>([]);
	let submitting = $state(false);

	// the household's own kind first, then the other catalogues
	const ownKind = $derived(householdKind(data.activeHousehold));
	const kinds = $derived([ownKind, ...HOUSEHOLD_KINDS.filter((k) => k !== ownKind)]);
	let catalogKind = $state<HouseholdKind>('chores');
	$effect.pre(() => {
		catalogKind = ownKind;
	});

	const unitLabels: Record<string, () => string> = {
		day: m.unit_day,
		week: m.unit_week,
		month: m.unit_month,
		year: m.unit_year
	};

	const existing = $derived(new Set(data.existingNames));
	const groups = $derived(
		catalogFor(catalogKind).map(({ category, quests }) => ({
			category,
			quests: quests.map((q) => ({
				...q,
				label: localize(q.name, locale),
				text: localize(q.description, locale),
				score: questScore(q),
				alreadyAdded: existing.has(localize(q.name, locale).toLowerCase())
			}))
		}))
	);
	// managed by hand rather than bind:group, which would drop the ticks of a
	// catalogue tab as soon as its checkboxes unmount
	function toggle(id: string, on: boolean) {
		selected = on ? [...selected, id] : selected.filter((s) => s !== id);
	}

	// ticked quests of the catalogues not shown right now still have to be posted
	const hiddenSelected = $derived(selected.filter((id) => QUEST_CATALOG.find((q) => q.id === id)?.kind !== catalogKind));
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

			<div role="radiogroup" aria-label={m.task_new_catalog_kinds()} class="kinds -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
				{#each kinds as kind (kind)}
					{@const Icon = KIND_ICONS[kind]}
					<label class="kind-tab">
						<input type="radio" name="catalog_kind" value={kind} bind:group={catalogKind} class="sr-only" />
						<span class="kind-icon" style="--c: {KIND_COLORS[kind]}" aria-hidden="true">
							<Icon class="size-3.5" strokeWidth={3} />
						</span>
						<span class="flex flex-col leading-tight">
							<span>{KIND_LABELS[kind]()}</span>
							{#if kind === ownKind}
								<span class="text-[0.65rem] tracking-wider uppercase opacity-75">{m.task_new_catalog_this_household()}</span>
							{/if}
						</span>
					</label>
				{/each}
			</div>

			{#each hiddenSelected as id (id)}
				<input type="hidden" name="quest" value={id} />
			{/each}

			{#each groups as group (group.category)}
				{@const CategoryIcon = CATEGORY_ICONS[group.category]}
				<fieldset class="flex flex-col gap-2">
					<legend class="field-label mb-2 flex items-center gap-1.5">
						<span
							class="grid size-5 place-items-center rounded-md border-2 border-night-950 text-white"
							style="background: {CATEGORY_COLORS[group.category]}"
							aria-hidden="true"
						>
							<CategoryIcon class="size-3" strokeWidth={3} />
						</span>
						{CATEGORY_LABELS[group.category]()}
					</legend>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each group.quests as quest (quest.id)}
							<label
								class="panel-inset flex cursor-pointer gap-3 p-3 has-checked:border-gold-400 has-checked:bg-gold-500/10 has-disabled:cursor-not-allowed has-disabled:opacity-50"
							>
								<input
									type="checkbox"
									name="quest"
									value={quest.id}
									checked={selected.includes(quest.id)}
									onchange={(e) => toggle(quest.id, e.currentTarget.checked)}
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
			initial={form?.name !== undefined ? form : undefined}
			error={form?.message}
			submitLabel={m.task_new_create()}
		/>
	</section>
</div>

<style>
	.kinds {
		scrollbar-width: none;
	}
	.kinds::-webkit-scrollbar {
		display: none;
	}
	.kind-tab {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.85rem 0.4rem 0.4rem;
		border-radius: 1rem;
		border: 2px solid var(--color-night-950);
		background: var(--color-night-800);
		color: var(--color-night-200);
		font-weight: 900;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.kind-tab:has(:checked) {
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.5);
	}
	.kind-tab:has(:focus-visible) {
		outline: 3px solid var(--color-gold-300);
		outline-offset: 2px;
	}
	.kind-icon {
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		flex-shrink: 0;
		border-radius: 0.6rem;
		border: 2px solid var(--color-night-950);
		background: var(--c);
		color: white;
	}
</style>
