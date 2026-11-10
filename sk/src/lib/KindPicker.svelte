<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { HOUSEHOLD_KINDS, type HouseholdKind } from '$lib/householdKinds';
	import { KIND_COLORS, KIND_DESCRIPTIONS, KIND_ICONS, KIND_LABELS } from '$lib/kindUi';
	import { getLocale } from '$lib/paraglide/runtime';
	import { QUEST_CATALOG, localize } from '$lib/questCatalog';

	/**
	 * Radio cards to pick a household kind, each with a few example quests
	 * from its preset catalogue so it's clear what the type brings.
	 */
	let {
		value = $bindable('chores'),
		name = 'kind',
		disabled = false
	}: { value?: HouseholdKind; name?: string; disabled?: boolean } = $props();

	const locale = getLocale();
	const examples = Object.fromEntries(
		HOUSEHOLD_KINDS.map((kind) => [
			kind,
			QUEST_CATALOG.filter((q) => q.kind === kind)
				.filter((_, i) => i % 4 === 0)
				.slice(0, 3)
				.map((q) => localize(q.name, locale))
				.join(' · ')
		])
	) as Record<HouseholdKind, string>;
</script>

<div class="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup">
	{#each HOUSEHOLD_KINDS as kind (kind)}
		{@const Icon = KIND_ICONS[kind]}
		<label
			class="panel-inset flex cursor-pointer gap-3 p-3 has-checked:border-gold-400 has-checked:bg-gold-500/10 has-disabled:cursor-not-allowed has-disabled:opacity-60"
		>
			<input type="radio" {name} value={kind} bind:group={value} {disabled} class="peer sr-only" />
			<span
				class="relative grid size-11 shrink-0 place-items-center rounded-xl border-[3px] border-night-950 text-white shadow-[inset_0_2px_0_rgb(255_255_255/0.35),0_3px_0_var(--color-night-950)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300"
				style="background: {KIND_COLORS[kind]}"
				aria-hidden="true"
			>
				<Icon class="size-5" strokeWidth={2.75} />
			</span>
			<span class="flex min-w-0 flex-1 flex-col gap-1">
				<span class="flex items-start justify-between gap-2">
					<span class="font-display text-[1.05rem] leading-tight text-white">{KIND_LABELS[kind]()}</span>
					{#if value === kind}
						<span class="grid size-5 shrink-0 place-items-center rounded-md bg-gold-400 text-gold-900" aria-hidden="true">
							<Check class="size-3.5" strokeWidth={4} />
						</span>
					{/if}
				</span>
				<span class="text-sm leading-snug font-semibold text-night-200">{KIND_DESCRIPTIONS[kind]()}</span>
				<span class="text-xs leading-snug font-extrabold text-night-300">{examples[kind]}</span>
			</span>
		</label>
	{/each}
</div>
