<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Dialog } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { ArrowLeftRight, CalendarSync, LoaderCircle, MapPin } from '@lucide/svelte';
	import { SLOT_ICONS, SLOT_LABELS, dayLabel, weekdayName } from '$lib/mealUi';
	import { formatDay, type Meal, type MealSlot, type Weekday } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import MealPhoto from '$lib/ui/MealPhoto.svelte';

	/**
	 * Bottom sheet to move a planned dish to another day of the week shown:
	 * one button per (day, slot). A free slot just receives the dish; if a
	 * dish is already planned there, the two swap. Posts the page's ?/move.
	 */
	let {
		open = $bindable(false),
		source,
		days,
		planned
	}: {
		open: boolean;
		source: { day: string; slot: MealSlot; meal: Meal } | null;
		days: { day: string; weekday: Weekday; slots: MealSlot[]; isToday: boolean; isPast: boolean }[];
		/** dish planned on each "day:slot" of the week */
		planned: Map<string, Meal | undefined>;
	} = $props();

	const locale = getLocale();

	let submitting = $state<string | null>(null);

	const targetDays = $derived(days.filter((d) => d.slots.length > 0));

	const submitMove: SubmitFunction = ({ submitter }) => {
		const to = submitter instanceof HTMLButtonElement ? submitter.value : '';
		const moving = source?.meal.name ?? '';
		const other = planned.get(to)?.name;
		const [toDay] = to.split(':');
		submitting = to;
		return async ({ result, update }) => {
			if (result.type === 'success') open = false;
			await update();
			submitting = null;
			if (result.type === 'success') {
				toast.success(
					other
						? m.meals_move_swapped({ name: moving, other })
						: m.meals_move_moved({ name: moving, day: formatDay(toDay, locale, { weekday: 'long', day: 'numeric', month: 'short' }) })
				);
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
		<Dialog.Content class="panel sheet flex flex-col gap-3">
			{#if source}
				{@const SourceIcon = SLOT_ICONS[source.slot]}
				<div class="flex flex-col items-center gap-1 text-center">
					<Dialog.Title class="ribbon">
						<CalendarSync class="size-4" strokeWidth={3} />{m.meals_move_title()}
					</Dialog.Title>
					<Dialog.Description class="mt-1.5 flex flex-col items-center gap-0.5">
						<span class="font-display text-lg leading-tight text-white">{source.meal.name}</span>
						<span class="flex items-center gap-1 text-sm font-extrabold text-night-300">
							<SourceIcon class="size-3.5" strokeWidth={3} />
							{SLOT_LABELS[source.slot]()} · {dayLabel(source.day, locale)}
						</span>
					</Dialog.Description>
				</div>

				<p class="text-center text-sm font-bold text-night-300">{m.meals_move_hint()}</p>

				<form method="post" action="?/move" use:enhance={submitMove}>
					<input type="hidden" name="from_day" value={source.day} />
					<input type="hidden" name="from_slot" value={source.slot} />
					<ul class="flex flex-col gap-1.5">
						{#each targetDays as d (d.day)}
							<li class="target-day" data-today={d.isToday} data-past={d.isPast}>
								<span class="target-date">
									<span class="font-display text-base leading-none text-white">{weekdayName(d.weekday, locale, 'short')}</span>
									<span class="text-xs font-extrabold text-night-300">{formatDay(d.day, locale, { day: 'numeric' })}</span>
								</span>
								<span class="flex min-w-0 flex-1 gap-1.5">
									{#each d.slots as slot (slot)}
										{@const key = `${d.day}:${slot}`}
										{@const here = planned.get(key)}
										{@const isSource = d.day === source.day && slot === source.slot}
										{@const SlotIcon = SLOT_ICONS[slot]}
										<button
											type="submit"
											name="to"
											value={key}
											class="target"
											data-occupied={Boolean(here)}
											aria-current={isSource ? 'true' : undefined}
											disabled={isSource || submitting !== null}
											aria-label={isSource
												? m.meals_move_here()
												: here
													? m.meals_move_swap_aria({ name: here.name, slot: SLOT_LABELS[slot](), day: weekdayName(d.weekday, locale) })
													: m.meals_move_to_aria({ slot: SLOT_LABELS[slot](), day: weekdayName(d.weekday, locale) })}
										>
											{#if d.slots.length > 1}
												<SlotIcon class="size-3.5 shrink-0 text-night-300" strokeWidth={3} />
											{/if}
											{#if isSource}
												<MapPin class="size-4 shrink-0" strokeWidth={3} />
												<span class="target-name">{m.meals_move_here()}</span>
											{:else if here}
												{#if d.slots.length === 1}
													<MealPhoto meal={here} class="size-7 shrink-0" />
												{/if}
												<span class="target-name">{here.name}</span>
												{#if submitting === key}
													<LoaderCircle class="size-4 shrink-0 animate-spin text-gold-300" strokeWidth={3} />
												{:else}
													<ArrowLeftRight class="size-4 shrink-0 text-gold-300" strokeWidth={3} />
												{/if}
											{:else}
												<span class="target-name target-free">{m.meals_move_free()}</span>
												{#if submitting === key}
													<LoaderCircle class="size-4 shrink-0 animate-spin text-gold-300" strokeWidth={3} />
												{/if}
											{/if}
										</button>
									{/each}
								</span>
							</li>
						{/each}
					</ul>
				</form>

				<Dialog.Close type="button" class="btn">{m.board_cancel()}</Dialog.Close>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.target-day {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.target-day[data-past='true'] {
		opacity: 0.7;
	}
	.target-date {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		flex-shrink: 0;
		width: 2.6rem;
	}
	.target-day[data-today='true'] .target-date span:first-child {
		color: var(--color-gold-300);
	}
	.target {
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.9rem;
		padding: 0.3rem 0.55rem 0.3rem 0.45rem;
		border-radius: 0.9rem;
		border: 3px dashed var(--color-night-500);
		cursor: pointer;
		transition:
			border-color 0.15s,
			background 0.15s,
			filter 0.15s;
	}
	.target[data-occupied='true'] {
		border-style: solid;
		border-color: var(--color-night-950);
		background: linear-gradient(180deg, var(--color-night-600), var(--color-night-700));
		box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.1);
	}
	.target:hover:not(:disabled) {
		border-color: var(--color-gold-400);
		background: rgb(255 205 56 / 0.1);
	}
	.target[aria-current='true'] {
		border-style: solid;
		border-color: #4fdc83;
		background: rgb(79 220 131 / 0.18);
		color: #4fdc83;
		cursor: default;
	}
	.target:disabled:not([aria-current='true']) {
		cursor: progress;
	}
	.target:focus-visible {
		outline-offset: 2px;
	}
	.target-name {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.85rem;
		font-weight: 900;
		color: white;
	}
	.target-free {
		color: var(--color-night-300);
		font-weight: 800;
	}
	.target[aria-current='true'] .target-name {
		color: #4fdc83;
	}
</style>
