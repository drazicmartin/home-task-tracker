<script lang="ts">
	import { ArrowDownUp, Search, SlidersHorizontal, X } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import {
		POINTS_FILTERS,
		QUEST_SORTS,
		RHYTHM_FILTERS,
		STATUS_FILTERS,
		activeFilterCount,
		emptyFilters,
		type QuestFilters,
		type QuestSort,
		type RhythmFilter,
		type StatusFilter
	} from '$lib/questFilters';
	import Coin from '$lib/ui/Coin.svelte';

	let {
		filters = $bindable(),
		shown,
		total
	}: { filters: QuestFilters; shown: number; total: number } = $props();

	let open = $state(false);
	let searchInput = $state<HTMLInputElement>();

	const activeCount = $derived(activeFilterCount(filters));
	const statusLabels: Record<StatusFilter, () => string> = {
		overdue: m.dashboard_health_overdue,
		dueSoon: m.dashboard_health_due_soon,
		ok: m.dashboard_health_ok,
		onDemand: m.board_on_demand
	};
	const rhythmLabels: Record<RhythmFilter, () => string> = {
		day: m.filter_rhythm_day,
		week: m.filter_rhythm_week,
		month: m.filter_rhythm_month,
		year: m.filter_rhythm_year
	};
	const sortLabels: Record<QuestSort, () => string> = {
		urgency: m.filter_sort_urgency,
		pointsDesc: m.filter_sort_points_desc,
		pointsAsc: m.filter_sort_points_asc,
		name: m.filter_sort_name
	};

	function toggle<T>(list: T[], value: T): T[] {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	function reset() {
		filters = { ...emptyFilters(), sort: filters.sort };
	}

	// "/" jumps to the search box from anywhere on the board (desktop keyboards)
	function onKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
		if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
			event.preventDefault();
			searchInput?.focus();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="flex flex-col gap-2">
	<div class="flex gap-2">
		<div class="relative min-w-0 flex-1">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-night-300"
				strokeWidth={3}
			/>
			<input
				bind:this={searchInput}
				bind:value={filters.query}
				type="search"
				aria-label={m.filter_search_label()}
				enterkeyhint="search"
				autocomplete="off"
				placeholder={m.filter_search_placeholder()}
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						filters.query = '';
						searchInput?.blur();
					}
				}}
				class="input pr-10 pl-10"
			/>
			{#if filters.query}
				<button
					type="button"
					onclick={() => {
						filters.query = '';
						searchInput?.focus();
					}}
					class="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-night-300 hover:text-white"
					aria-label={m.filter_search_clear()}
				>
					<X class="size-4" strokeWidth={3.5} />
				</button>
			{/if}
		</div>

		<button
			type="button"
			onclick={() => (open = !open)}
			aria-expanded={open}
			aria-controls="quest-filters"
			class="btn relative shrink-0 {activeCount > 0 ? 'btn-blue' : ''}"
			aria-label={m.filter_toggle()}
		>
			<SlidersHorizontal class="size-5" strokeWidth={3} />
			<span class="hidden sm:inline">{m.filter_toggle()}</span>
			{#if activeCount > 0}
				<span class="filter-badge" aria-hidden="true">{activeCount}</span>
			{/if}
		</button>
	</div>

	{#if open}
		<div id="quest-filters" class="panel-inset flex flex-col gap-3 p-3">
			<fieldset class="flex flex-col gap-1.5">
				<legend class="field-label mb-1.5">{m.filter_status()}</legend>
				<div class="flex flex-wrap gap-1.5">
					{#each STATUS_FILTERS as status (status)}
						<button
							type="button"
							class="pill"
							aria-pressed={filters.status.includes(status)}
							onclick={() => (filters.status = toggle(filters.status, status))}
						>
							<span class="pill-dot pill-dot-{status}" aria-hidden="true"></span>{statusLabels[status]()}
						</button>
					{/each}
				</div>
			</fieldset>

			<fieldset class="flex flex-col gap-1.5">
				<legend class="field-label mb-1.5">{m.filter_points()}</legend>
				<div class="flex flex-wrap gap-1.5">
					{#each POINTS_FILTERS as range (range.id)}
						<button
							type="button"
							class="pill"
							aria-pressed={filters.points.includes(range.id)}
							onclick={() => (filters.points = toggle(filters.points, range.id))}
						>
							<Coin class="size-4" />{range.label}
						</button>
					{/each}
				</div>
			</fieldset>

			<fieldset class="flex flex-col gap-1.5">
				<legend class="field-label mb-1.5">{m.filter_rhythm()}</legend>
				<div class="flex flex-wrap gap-1.5">
					{#each RHYTHM_FILTERS as rhythm (rhythm)}
						<button
							type="button"
							class="pill"
							aria-pressed={filters.rhythm.includes(rhythm)}
							onclick={() => (filters.rhythm = toggle(filters.rhythm, rhythm))}
						>
							{rhythmLabels[rhythm]()}
						</button>
					{/each}
				</div>
			</fieldset>

			<div class="flex flex-col gap-2">
				<label class="field">
					<span class="field-label flex items-center gap-1"
						><ArrowDownUp class="size-3.5" strokeWidth={3} />{m.filter_sort()}</span
					>
					<select bind:value={filters.sort} class="input">
						{#each QUEST_SORTS as sort (sort)}
							<option value={sort}>{sortLabels[sort]()}</option>
						{/each}
					</select>
				</label>
				{#if activeCount > 0}
					<button type="button" onclick={reset} class="btn btn-sm self-end">
						<X class="size-4" strokeWidth={3.5} />{m.filter_reset()}
					</button>
				{/if}
			</div>
		</div>
	{/if}

	{#if shown !== total}
		<p class="px-1 text-xs font-extrabold text-night-300" aria-live="polite">
			{m.filter_results({ shown, total })}
		</p>
	{/if}
</div>

<style>
	.filter-badge {
		position: absolute;
		top: -0.5rem;
		right: -0.5rem;
		display: grid;
		place-items: center;
		min-width: 1.4rem;
		height: 1.4rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: var(--color-gold-400);
		color: var(--color-gold-900);
		font-size: 0.75rem;
		font-weight: 900;
		line-height: 1;
	}

	/* Toggleable filter chip; pressed = gold. Large enough to tap on phones. */
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 2.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		color: var(--color-night-100);
		font-size: 0.85rem;
		font-weight: 900;
		transition:
			background 0.15s,
			color 0.15s,
			transform 0.1s;
	}
	.pill:hover {
		background: rgb(11 7 32 / 0.7);
		color: white;
	}
	.pill:active {
		transform: translateY(1px);
	}
	.pill[aria-pressed='true'] {
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		box-shadow: inset 0 -2px 0 var(--color-gold-600);
	}

	.pill-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
	}
	/* same colours as the board's status chips */
	.pill-dot-overdue {
		background: #f43f5e;
	}
	.pill-dot-dueSoon {
		background: #f59e0b;
	}
	.pill-dot-ok {
		background: #22c55e;
	}
	.pill-dot-onDemand {
		background: #8b5cf6;
	}
</style>
