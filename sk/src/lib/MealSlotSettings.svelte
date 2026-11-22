<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { Check, LoaderCircle, Lock, Settings } from '@lucide/svelte';
	import { PRESET_LABELS, SLOT_ICONS, SLOT_LABELS, weekdayName } from '$lib/mealUi';
	import { MEAL_SLOT_PRESETS, MEAL_SLOTS, WEEKDAYS, sameMealSlots, type MealSlotSettings } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { untrack } from 'svelte';

	/**
	 * Which meals the planner shows on each weekday — a 7 × 2 grid of toggles
	 * (lunch / dinner), with a few one-tap presets. Stored on the household,
	 * so only its owner can change it (everyone else sees it read-only).
	 */
	let {
		open = $bindable(false),
		slots,
		isOwner
	}: { open: boolean; slots: MealSlotSettings; isOwner: boolean } = $props();

	const locale = getLocale();

	let draft = $state<MealSlotSettings>(structuredClone(MEAL_SLOT_PRESETS[0].slots));
	let saving = $state(false);

	// Start from the saved settings every time the sheet opens — and only then:
	// `slots` is untracked so a page data reload while it's open doesn't wipe
	// the toggles being edited.
	$effect.pre(() => {
		if (open) draft = untrack(() => structuredClone($state.snapshot(slots)));
	});

	const changed = $derived(!sameMealSlots(draft, slots));

	function toggle(day: (typeof WEEKDAYS)[number], slot: (typeof MEAL_SLOTS)[number], on: boolean) {
		draft[day] = MEAL_SLOTS.filter((s) => (s === slot ? on : draft[day].includes(s)));
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="overlay" />
		<Dialog.Content class="panel sheet">
			<div class="mb-4 flex flex-col items-center gap-2 text-center">
				<Dialog.Title class="ribbon"><Settings class="size-4" strokeWidth={3} />{m.meals_settings()}</Dialog.Title>
				<Dialog.Description class="text-sm font-bold text-night-200">{m.meals_settings_hint()}</Dialog.Description>
			</div>

			{#if !isOwner}
				<p class="mb-3 flex items-center gap-2 rounded-xl bg-night-950/50 px-3 py-2 text-sm font-bold text-night-200">
					<Lock class="size-4 shrink-0" strokeWidth={3} />{m.meals_settings_owner_only()}
				</p>
			{/if}

			<form
				method="post"
				action="?/saveSlots"
				use:enhance={() => {
					saving = true;
					return async ({ result, update }) => {
						// reload first, so that reopening the sheet right away starts from the new settings
						await update();
						saving = false;
						if (result.type === 'success') {
							open = false;
							toast.success(m.meals_settings_saved());
						} else {
							const message = result.type === 'failure' ? (result.data?.message as string | undefined) : undefined;
							toast.error(message ?? m.generic_error());
						}
					};
				}}
				class="flex flex-col gap-4"
			>
				<fieldset disabled={!isOwner} class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<span class="field-label">{m.meals_settings_presets()}</span>
						<div class="flex flex-col gap-1.5">
							{#each MEAL_SLOT_PRESETS as preset (preset.id)}
								{@const active = sameMealSlots(draft, preset.slots)}
								<button
									type="button"
									class="preset"
									aria-pressed={active}
									onclick={() => (draft = structuredClone(preset.slots))}
								>
									{#if active}<Check class="size-4 shrink-0" strokeWidth={3.5} />{/if}
									{PRESET_LABELS[preset.id]()}
								</button>
							{/each}
						</div>
					</div>

					<table class="w-full border-separate border-spacing-y-1.5">
						<thead>
							<tr>
								<th class="sr-only">{m.meals_settings_day()}</th>
								{#each MEAL_SLOTS as slot (slot)}
									{@const Icon = SLOT_ICONS[slot]}
									<th class="field-label w-24 pb-0.5 text-center">
										<span class="inline-flex items-center gap-1"><Icon class="size-3.5" strokeWidth={3} />{SLOT_LABELS[slot]()}</span>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each WEEKDAYS as day (day)}
								<tr>
									<th scope="row" class="pr-2 text-left font-display text-[1.05rem] font-normal text-white">
										{weekdayName(day, locale)}
									</th>
									{#each MEAL_SLOTS as slot (slot)}
										{@const Icon = SLOT_ICONS[slot]}
										<td class="text-center">
											<label class="toggle">
												<input
													type="checkbox"
													name="slot"
													value="{day}:{slot}"
													checked={draft[day].includes(slot)}
													onchange={(e) => toggle(day, slot, e.currentTarget.checked)}
													class="sr-only"
													aria-label="{weekdayName(day, locale)} · {SLOT_LABELS[slot]()}"
												/>
												<Icon class="size-5" strokeWidth={3} />
											</label>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</fieldset>

				<div class="grid grid-cols-[auto_1fr] gap-3">
					<Dialog.Close type="button" class="btn">{isOwner ? m.board_cancel() : m.close()}</Dialog.Close>
					{#if isOwner}
						<button type="submit" class="btn btn-gold" disabled={!changed || saving}>
							{#if saving}<LoaderCircle class="size-5 animate-spin" strokeWidth={3} />{:else}<Check
									class="size-5"
									strokeWidth={3.5}
								/>{/if}
							{m.meals_settings_save()}
						</button>
					{/if}
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.preset {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.5rem;
		padding: 0.4rem 0.8rem;
		border-radius: 0.85rem;
		border: 2.5px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		color: var(--color-night-100);
		font-size: 0.875rem;
		font-weight: 900;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
	}
	.preset:hover:not(:disabled) {
		background: rgb(11 7 32 / 0.7);
	}
	.preset[aria-pressed='true'] {
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		box-shadow: inset 0 -2px 0 var(--color-gold-600);
	}
	.preset:disabled {
		cursor: default;
	}

	.toggle {
		display: inline-grid;
		place-items: center;
		width: 100%;
		max-width: 5rem;
		height: 2.75rem;
		border-radius: 0.85rem;
		border: 3px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		color: var(--color-night-500);
		box-shadow: inset 0 3px 0 rgb(0 0 0 / 0.25);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			transform 0.15s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.toggle:has(input:checked) {
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.5),
			inset 0 -3px 0 var(--color-gold-600);
	}
	.toggle:has(input:focus-visible) {
		outline: 3px solid var(--color-gold-300);
		outline-offset: 2px;
	}
	.toggle:active {
		transform: scale(0.94);
	}
	fieldset:disabled .toggle {
		cursor: default;
		opacity: 0.8;
	}
</style>
