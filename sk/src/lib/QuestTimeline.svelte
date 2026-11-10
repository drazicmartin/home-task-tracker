<script lang="ts">
	import {
		Bath,
		CalendarDays,
		PawPrint,
		Shirt,
		ShoppingCart,
		SprayCan,
		Sprout,
		Star,
		UtensilsCrossed,
		X,
		type LucideIcon
	} from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { CATEGORY_COLORS, TASK_CATEGORIES, type TaskCategory } from '$lib/questCategories';
	import { TIMELINE_DAYS, type TimelineEvent } from '$lib/timeline';
	import { formatPoints } from '$lib/game';
	import Coin from '$lib/ui/Coin.svelte';

	let { events }: { events: TimelineEvent[] } = $props();

	/** Bubbles drawn per day before collapsing the rest into "+N". */
	const MAX_PER_DAY = 3;

	const ICONS: Record<TaskCategory, LucideIcon> = {
		kitchen: UtensilsCrossed,
		floors: SprayCan,
		bathroom: Bath,
		laundry: Shirt,
		pets: PawPrint,
		outdoor: Sprout,
		errands: ShoppingCart,
		other: Star
	};
	const LABELS: Record<TaskCategory, () => string> = {
		kitchen: m.catalog_cat_kitchen,
		floors: m.catalog_cat_floors,
		bathroom: m.catalog_cat_bathroom,
		laundry: m.catalog_cat_laundry,
		pets: m.catalog_cat_pets,
		outdoor: m.catalog_cat_outdoor,
		errands: m.catalog_cat_errands,
		other: m.catalog_cat_other
	};

	const locale = getLocale();
	const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'short' });
	const fmtWeekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
	const fmtLong = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
	const fmtTime = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });

	// Days are the viewer's local calendar days, which the server can't know:
	// the strip renders after mount only (a same-height placeholder before).
	let mounted = $state(false);
	let scroller = $state<HTMLElement>();
	let selectedDay = $state<string | null>(null);
	let selectedEvent = $state<string | null>(null);
	let focus = $state<TaskCategory | null>(null);

	$effect(() => {
		mounted = true;
	});
	// start scrolled to today (the right end) on phones
	$effect(() => {
		if (scroller) scroller.scrollLeft = scroller.scrollWidth;
	});

	const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

	type Day = { key: string; date: Date; events: TimelineEvent[]; isToday: boolean; isWeekend: boolean };

	const days = $derived.by((): Day[] => {
		if (!mounted) return [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const list: Day[] = [];
		// TIMELINE_DAYS back from now can land on the morning of day -30: include it
		for (let i = TIMELINE_DAYS; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			list.push({
				key: dayKey(date),
				date,
				events: [],
				isToday: i === 0,
				isWeekend: date.getDay() === 0 || date.getDay() === 6
			});
		}
		const byKey = new Map(list.map((d) => [d.key, d]));
		for (const event of events) byKey.get(dayKey(new Date(event.at)))?.events.push(event);
		return list;
	});

	const totalPoints = $derived(formatPoints(Math.round(events.reduce((s, e) => s + e.points, 0) * 100) / 100));
	const legend = $derived(
		TASK_CATEGORIES.map((category) => ({ category, count: events.filter((e) => e.category === category).length }))
			.filter((c) => c.count > 0)
			.sort((a, b) => b.count - a.count)
	);
	const selected = $derived(days.find((d) => d.key === selectedDay) ?? null);

	function select(day: Day, eventId: string | null) {
		if (selectedDay === day.key && selectedEvent === eventId) {
			selectedDay = selectedEvent = null;
		} else {
			selectedDay = day.key;
			selectedEvent = eventId;
		}
	}

	const eventName = (e: TimelineEvent) => e.taskName ?? m.timeline_deleted_quest();
	const showMonth = (day: Day, i: number) => i === 0 || day.date.getDate() === 1;
</script>

<section class="panel p-3 sm:p-4">
	<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
		<h2 class="panel-heading"><CalendarDays class="size-5" strokeWidth={3} />{m.timeline_title()}</h2>
		{#if events.length > 0}
			<span class="flex items-center gap-1 text-xs font-extrabold text-night-200">
				{m.timeline_summary({ count: events.length })} · <Coin class="size-4" />{totalPoints}
			</span>
		{/if}
	</div>

	{#if !mounted}
		<div class="track-placeholder" aria-hidden="true"></div>
	{:else}
		<div class="scroller" bind:this={scroller}>
			<ol class="track" aria-label={m.timeline_title()}>
				{#each days as day, i (day.key)}
					{@const hidden = day.events.length - MAX_PER_DAY}
					<li class="day" data-today={day.isToday} data-weekend={day.isWeekend} data-selected={selectedDay === day.key}>
						<span class="day-month" aria-hidden="true">{showMonth(day, i) ? fmtMonth.format(day.date) : ''}</span>
						<div class="day-events">
							{#if day.events.length === 0}
								<span class="tick" aria-hidden="true"></span>
							{:else}
								{#each day.events.slice(0, hidden > 0 ? MAX_PER_DAY - 1 : MAX_PER_DAY) as event (event.id)}
									{@const Icon = ICONS[event.category]}
									<button
										type="button"
										class="bubble"
										style="--c: {CATEGORY_COLORS[event.category]}"
										data-dim={focus !== null && focus !== event.category}
										data-active={selectedEvent === event.id}
										onclick={() => select(day, event.id)}
										aria-label={m.timeline_event_aria({
											name: eventName(event),
											users: event.users.join(', '),
											date: fmtLong.format(new Date(event.at))
										})}
										title={eventName(event)}
									>
										<Icon class="size-4" strokeWidth={2.75} />
										{#if event.users.length > 1}
											<span class="bubble-count" aria-hidden="true">{event.users.length}</span>
										{/if}
									</button>
								{/each}
								{#if hidden > 0}
									<button
										type="button"
										class="bubble bubble-more"
										onclick={() => select(day, null)}
										aria-label={m.timeline_more({ count: hidden + 1 })}
									>
										+{hidden + 1}
									</button>
								{/if}
							{/if}
						</div>
						<span class="day-label">
							<span class="day-weekday">{fmtWeekday.format(day.date)}</span>
							<span class="day-number">{day.date.getDate()}</span>
						</span>
					</li>
				{/each}
			</ol>
		</div>

		{#if events.length === 0}
			<p class="mt-2 text-center text-sm font-bold text-night-300">{m.timeline_empty()}</p>
		{:else if selected}
			<div class="panel-inset mt-2 flex flex-col gap-2 p-3">
				<div class="flex items-center justify-between gap-2">
					<span class="font-display text-white first-letter:uppercase">{fmtLong.format(selected.date)}</span>
					<button
						type="button"
						class="grid size-7 place-items-center rounded-full text-night-300 hover:text-white"
						onclick={() => (selectedDay = selectedEvent = null)}
						aria-label={m.timeline_close()}
					>
						<X class="size-4" strokeWidth={3.5} />
					</button>
				</div>
				<ul class="flex flex-col gap-1.5">
					{#each selected.events as event (event.id)}
						{@const Icon = ICONS[event.category]}
						<li class="detail" data-active={selectedEvent === event.id}>
							<span class="bubble bubble-static" style="--c: {CATEGORY_COLORS[event.category]}" aria-hidden="true">
								<Icon class="size-4" strokeWidth={2.75} />
							</span>
							<span class="flex min-w-0 flex-1 flex-col">
								<span class="truncate font-extrabold text-white {event.taskName ? '' : 'italic'}">{eventName(event)}</span>
								<span class="truncate text-xs font-bold text-night-300">
									{fmtTime.format(new Date(event.at))} · {event.users.join(', ')}
								</span>
							</span>
							<span class="flex shrink-0 items-center gap-1 font-display text-gold-200">
								<Coin class="size-5" />{formatPoints(event.points)}
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="mt-1 text-center text-xs font-bold text-night-300">{m.timeline_hint()}</p>
		{/if}

		{#if legend.length > 0}
			<div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={m.timeline_legend()}>
				{#each legend as { category, count } (category)}
					{@const Icon = ICONS[category]}
					<button
						type="button"
						class="legend"
						style="--c: {CATEGORY_COLORS[category]}"
						aria-pressed={focus === category}
						data-dim={focus !== null && focus !== category}
						onclick={() => (focus = focus === category ? null : category)}
					>
						<span class="legend-icon" aria-hidden="true"><Icon class="size-3" strokeWidth={3} /></span>
						{LABELS[category]()}
						<span class="opacity-70">{count}</span>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</section>

<style>
	/* placeholder of the strip's height so the page doesn't jump on mount */
	.track-placeholder {
		height: 6.1rem;
	}

	.scroller {
		margin: 0.25rem -0.25rem 0;
		padding: 0 0.25rem 0.25rem;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
	}

	.track {
		--events-h: 2.6rem;
		position: relative;
		display: flex;
		width: max-content;
		min-width: 100%;
	}
	/* the single line every event sits on */
	.track::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: calc(1.1rem + var(--events-h) / 2 - 2px);
		height: 4px;
		border-radius: 999px;
		background: var(--color-night-950);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.08);
	}

	.day {
		position: relative;
		display: flex;
		flex: 1 0 auto;
		flex-direction: column;
		align-items: center;
		min-width: 2.35rem;
		padding: 0 0.2rem;
		border-radius: 0.75rem;
	}
	.day[data-weekend='true'] {
		background: rgb(255 255 255 / 0.03);
	}
	.day[data-selected='true'] {
		background: rgb(255 255 255 / 0.09);
	}

	.day-month {
		height: 1.1rem;
		font-size: 0.65rem;
		font-weight: 900;
		line-height: 1.1rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--color-night-300);
	}

	.day-events {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		height: var(--events-h);
	}

	.tick {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: var(--color-night-600);
	}
	.day[data-today='true'] .tick {
		background: var(--color-gold-400);
	}

	.day-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1;
		color: var(--color-night-300);
	}
	.day-weekday {
		font-size: 0.6rem;
		font-weight: 800;
		text-transform: uppercase;
		opacity: 0.75;
	}
	.day-number {
		margin-top: 0.1rem;
		font-size: 0.8rem;
		font-weight: 900;
	}
	.day[data-today='true'] .day-label {
		color: var(--color-gold-300);
	}
	.day[data-today='true'] .day-number {
		padding: 0.1rem 0.35rem;
		border-radius: 999px;
		background: var(--color-gold-400);
		color: var(--color-gold-900);
	}

	.bubble {
		position: relative;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: linear-gradient(180deg, color-mix(in srgb, var(--c) 80%, white), var(--c));
		color: white;
		box-shadow:
			inset 0 -2px 0 color-mix(in srgb, var(--c) 60%, black),
			0 2px 0 var(--color-night-950);
		cursor: pointer;
		transition:
			transform 0.15s cubic-bezier(0.2, 1.5, 0.4, 1),
			opacity 0.15s,
			filter 0.15s;
	}
	.bubble:hover {
		transform: translateY(-2px) scale(1.08);
	}
	.bubble[data-active='true'] {
		transform: translateY(-2px) scale(1.12);
		outline: 2.5px solid white;
		outline-offset: 1px;
	}
	.bubble[data-dim='true'] {
		opacity: 0.25;
		filter: grayscale(0.8);
	}
	.bubble-static {
		cursor: default;
	}
	.bubble-static:hover {
		transform: none;
	}
	.bubble-more {
		--c: var(--color-night-500);
		font-size: 0.7rem;
		font-weight: 900;
	}
	.bubble-count {
		position: absolute;
		right: -0.35rem;
		bottom: -0.35rem;
		display: grid;
		place-items: center;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.15rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: white;
		color: var(--color-night-950);
		font-size: 0.6rem;
		font-weight: 900;
		line-height: 1;
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.3rem 0.4rem;
		border-radius: 0.75rem;
	}
	.detail[data-active='true'] {
		background: rgb(255 255 255 / 0.08);
	}

	.legend {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 1.9rem;
		padding: 0.15rem 0.6rem 0.15rem 0.25rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		color: var(--color-night-100);
		font-size: 0.75rem;
		font-weight: 900;
		transition:
			opacity 0.15s,
			background 0.15s;
	}
	.legend[aria-pressed='true'] {
		background: color-mix(in srgb, var(--c) 35%, transparent);
		color: white;
	}
	.legend[data-dim='true'] {
		opacity: 0.5;
	}
	.legend-icon {
		display: grid;
		place-items: center;
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: var(--c);
		color: white;
	}
</style>
