<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { BookOpen, CalendarCheck, ChevronLeft, ChevronRight, Plus, Settings, UtensilsCrossed, X } from '@lucide/svelte';
	import MealPicker from '$lib/MealPicker.svelte';
	import MealSlotSettings from '$lib/MealSlotSettings.svelte';
	import { SLOT_ICONS, SLOT_LABELS, weekdayName } from '$lib/mealUi';
	import { addDays, formatDay, weekDays, weekStart, type MealSlot } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import MealBadges from '$lib/ui/MealBadges.svelte';
	import MealPhoto from '$lib/ui/MealPhoto.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const locale = getLocale();

	let pickerOpen = $state(false);
	let target = $state<{ day: string; slot: MealSlot } | null>(null);
	let settingsOpen = $state(false);
	let clearing = $state<string | null>(null);

	const mealsById = $derived(new Map(data.meals.map((meal) => [meal.id, meal])));
	const planned = $derived(new Map(data.plan.map((p) => [`${p.day}:${p.slot}`, mealsById.get(p.meal)])));
	const days = $derived(
		weekDays(data.week).map(({ day, weekday }) => ({
			day,
			weekday,
			slots: data.slots[weekday],
			isToday: day === data.today,
			isPast: day < data.today
		}))
	);
	const slotCount = $derived(days.reduce((sum, d) => sum + d.slots.length, 0));
	const plannedCount = $derived(
		days.reduce((sum, d) => sum + d.slots.filter((slot) => planned.get(`${d.day}:${slot}`)).length, 0)
	);
	const isCurrentWeek = $derived(data.week === weekStart(data.today));
	const weekRange = $derived(
		m.meals_week_range({
			from: formatDay(data.week, locale, { day: 'numeric', month: 'short' }),
			to: formatDay(addDays(data.week, 6), locale, { day: 'numeric', month: 'short' })
		})
	);
	const currentMealId = $derived(target ? planned.get(`${target.day}:${target.slot}`)?.id : undefined);

	function openPicker(day: string, slot: MealSlot) {
		target = { day, slot };
		pickerOpen = true;
	}

	// Opening the planner on this week: bring today's meals into view.
	onMount(() => {
		if (page.url.searchParams.has('week') || !isCurrentWeek) return;
		const index = days.findIndex((d) => d.isToday);
		if (index >= 2) document.getElementById(`day-${data.today}`)?.scrollIntoView({ block: 'start' });
	});
</script>

<div class="flex flex-col gap-4">
	<PageHeader title={m.meals_title()} eyebrow={data.activeHousehold?.name} icon={UtensilsCrossed}>
		{#snippet actions()}
			<a href="/meals/library" class="btn btn-sm" aria-label={m.meals_library_title()}>
				<BookOpen class="size-5" strokeWidth={3} />
				<span class="hidden sm:inline">{m.meals_library_title()}</span>
			</a>
			<button
				type="button"
				class="btn btn-sm btn-icon"
				aria-label={m.meals_settings()}
				aria-haspopup="dialog"
				onclick={() => (settingsOpen = true)}
			>
				<Settings class="size-5" strokeWidth={3} />
			</button>
		{/snippet}
	</PageHeader>

	<!-- Week switcher -->
	<nav class="panel-inset flex items-center gap-2 p-1.5" aria-label={m.meals_week_nav()}>
		<a
			href="?week={addDays(data.week, -7)}"
			class="btn btn-sm btn-icon"
			aria-label={m.meals_week_prev()}
			data-sveltekit-noscroll
			data-sveltekit-replacestate
		>
			<ChevronLeft class="size-5" strokeWidth={3.5} />
		</a>
		<div class="flex min-w-0 flex-1 flex-col items-center text-center">
			<span class="truncate font-display text-lg leading-tight text-white">{weekRange}</span>
			{#if isCurrentWeek}
				<span class="text-xs font-black tracking-wider text-gold-300 uppercase">{m.meals_week_current()}</span>
			{:else}
				<a href="/meals" class="link text-xs" data-sveltekit-noscroll data-sveltekit-replacestate>{m.meals_week_back_to_current()}</a>
			{/if}
		</div>
		<a
			href="?week={addDays(data.week, 7)}"
			class="btn btn-sm btn-icon"
			aria-label={m.meals_week_next()}
			data-sveltekit-noscroll
			data-sveltekit-replacestate
		>
			<ChevronRight class="size-5" strokeWidth={3.5} />
		</a>
	</nav>

	{#if slotCount > 0}
		<div>
			{#if plannedCount === slotCount}
				<span class="chip chip-ok"><CalendarCheck class="size-3.5" strokeWidth={3} />{m.meals_week_complete()}</span>
			{:else}
				<span class="chip">{m.meals_planned_count({ planned: plannedCount, total: slotCount })}</span>
			{/if}
		</div>
	{/if}

	<ul class="grid grid-cols-1 gap-3 md:grid-cols-2">
		{#each days as d, i (d.day)}
			<li
				id="day-{d.day}"
				class="day animate-rise"
				data-today={d.isToday}
				data-past={d.isPast}
				style="animation-delay: {i * 35}ms"
			>
				<header class="flex items-baseline justify-between gap-2">
					<h2 class="flex items-baseline gap-2">
						<span class="text-outline font-display text-xl text-white">{weekdayName(d.weekday, locale)}</span>
						<span class="text-sm font-extrabold text-night-300">{formatDay(d.day, locale, { day: 'numeric', month: 'short' })}</span>
					</h2>
					{#if d.isToday}
						<span class="chip chip-gold">{m.meals_today()}</span>
					{/if}
				</header>

				{#if d.slots.length === 0}
					<p class="text-sm font-bold text-night-400">{m.meals_no_slot_day()}</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each d.slots as slot (slot)}
							{@const meal = planned.get(`${d.day}:${slot}`)}
							{@const SlotIcon = SLOT_ICONS[slot]}
							{@const key = `${d.day}:${slot}`}
							<div class="slot-row">
								<span class="slot-label">
									<SlotIcon class="size-4" strokeWidth={3} />
									<span>{SLOT_LABELS[slot]()}</span>
								</span>
								{#if meal}
									<div class="planned">
										<button
											type="button"
											class="planned-main"
											aria-label={m.meals_change_aria({ slot: SLOT_LABELS[slot](), day: weekdayName(d.weekday, locale), name: meal.name })}
											onclick={() => openPicker(d.day, slot)}
										>
											<MealPhoto {meal} class="size-12" />
											<span class="flex min-w-0 flex-1 flex-col gap-1 text-left">
												<span class="planned-name">{meal.name}</span>
												<MealBadges {meal} compact />
											</span>
										</button>
										<form
											method="post"
											action="?/clear"
											use:enhance={() => {
												clearing = key;
												// read now: once the plan reloads, this slot has no dish any more
												const name = meal.name;
												return async ({ result, update }) => {
													await update();
													clearing = null;
													if (result.type === 'success') toast.success(m.meals_cleared({ name }));
													else toast.error(m.generic_error());
												};
											}}
											class="flex"
										>
											<input type="hidden" name="day" value={d.day} />
											<input type="hidden" name="slot" value={slot} />
											<button
												type="submit"
												class="planned-clear"
												disabled={clearing === key}
												aria-label={m.meals_clear_aria({ name: meal.name, day: weekdayName(d.weekday, locale) })}
											>
												<X class="size-4" strokeWidth={3.5} />
											</button>
										</form>
									</div>
								{:else}
									<button type="button" class="slot-empty" onclick={() => openPicker(d.day, slot)}>
										<Plus class="size-4" strokeWidth={3.5} />{m.meals_choose()}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	{#if slotCount === 0}
		<button type="button" class="btn self-center" onclick={() => (settingsOpen = true)}>
			<Settings class="size-5" strokeWidth={3} />{m.meals_settings()}
		</button>
	{/if}
</div>

<MealPicker bind:open={pickerOpen} {target} meals={data.meals} {currentMealId} />
<MealSlotSettings bind:open={settingsOpen} slots={data.slots} isOwner={data.isOwner} />

<style>
	.day {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		padding: 0.8rem 0.85rem 0.9rem;
		border-radius: 1.25rem;
		border: 3px solid var(--color-night-950);
		background: linear-gradient(180deg, var(--color-night-700), var(--color-night-800));
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.12),
			inset 0 -3px 0 rgb(0 0 0 / 0.25),
			0 4px 0 var(--color-night-950);
		/* clears the sticky HUD when scrolled to */
		scroll-margin-top: 8.5rem;
	}
	.day[data-today='true'] {
		border-color: var(--color-gold-400);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.12),
			inset 0 -3px 0 rgb(0 0 0 / 0.25),
			0 4px 0 var(--color-night-950),
			0 0 0 3px rgb(255 205 56 / 0.25);
	}
	.day[data-past='true'] {
		opacity: 0.7;
	}

	/* Slot name in a narrow column left of the dish; above it on small phones. */
	.slot-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.slot-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		flex-shrink: 0;
		width: 2.9rem;
		color: var(--color-night-200);
		font-size: 0.65rem;
		font-weight: 900;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	@media (max-width: 359px) {
		.slot-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.3rem;
		}
		.slot-label {
			flex-direction: row;
			gap: 0.3rem;
			width: auto;
			padding-left: 0.2rem;
		}
	}

	.planned {
		display: flex;
		flex: 1;
		min-width: 0;
		align-items: stretch;
		border-radius: 1.1rem;
		border: 3px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		overflow: hidden;
	}
	.planned-main {
		display: flex;
		flex: 1;
		min-width: 0;
		align-items: center;
		gap: 0.7rem;
		padding: 0.4rem 0.5rem 0.4rem 0.4rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.planned-main:hover {
		background: rgb(11 7 32 / 0.35);
	}
	.planned-main:focus-visible,
	.planned-clear:focus-visible {
		outline-offset: -3px;
	}
	.planned-name {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-family: var(--font-display);
		font-size: 1.05rem;
		line-height: 1.15;
		color: white;
		overflow-wrap: break-word;
	}
	.planned-clear {
		display: grid;
		place-items: center;
		width: 2.5rem;
		border-left: 3px solid var(--color-night-950);
		color: var(--color-night-300);
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.planned-clear:hover:not(:disabled) {
		color: white;
		background: rgb(225 29 72 / 0.35);
	}
	.planned-clear:disabled {
		opacity: 0.5;
		cursor: progress;
	}

	.slot-empty {
		display: flex;
		flex: 1;
		min-width: 0;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 3.75rem;
		border-radius: 1.1rem;
		border: 3px dashed var(--color-night-500);
		color: var(--color-night-200);
		font-family: var(--font-display);
		font-size: 1rem;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s,
			background 0.15s;
	}
	.slot-empty:hover {
		color: white;
		border-color: var(--color-gold-400);
		background: rgb(255 205 56 / 0.08);
	}
</style>
