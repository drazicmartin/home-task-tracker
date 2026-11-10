<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, Hand, TriangleAlert } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import Coin from '$lib/ui/Coin.svelte';

	let {
		action,
		initial = { name: '', description: '', frequency: 1, unit: 'week', score: 1 },
		error,
		submitLabel,
		autofocus = false
	}: {
		action: string;
		initial?: {
			name: string;
			description: string;
			frequency: number;
			unit: string;
			score: number;
			on_demand?: boolean;
		};
		error?: string;
		submitLabel?: string;
		/** Focus and select the name field on mount (e.g. when duplicating a quest). */
		autofocus?: boolean;
	} = $props();

	let nameInput = $state<HTMLInputElement>();
	// svelte-ignore state_referenced_locally -- seeded once from the initial values, then owned by the checkbox
	let onDemand = $state(Boolean(initial.on_demand));

	$effect(() => {
		if (autofocus && nameInput) {
			nameInput.focus();
			nameInput.select();
		}
	});
</script>

<form method="post" {action} use:enhance class="flex flex-col gap-4">
	{#if error}
		<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{error}</p>
	{/if}

	<label class="field">
		<span class="field-label">{m.task_form_name()}</span>
		<input bind:this={nameInput} name="name" type="text" required value={initial.name} class="input" />
	</label>

	<label class="field">
		<span class="field-label">{m.task_form_description()}</span>
		<textarea name="description" rows="3" class="input">{initial.description}</textarea>
	</label>

	<!-- On-demand quests have no recurrence: they never become due or overdue. -->
	<label
		class="panel-inset flex cursor-pointer items-start gap-3 p-3 has-checked:border-gold-400 has-checked:bg-gold-500/10"
	>
		<input type="checkbox" name="on_demand" bind:checked={onDemand} class="peer sr-only" />
		<span
			class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-[3px] border-night-950 bg-night-900 text-transparent peer-checked:bg-gold-400 peer-checked:text-gold-900 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300"
			aria-hidden="true"
		>
			<Check class="size-4" strokeWidth={4} />
		</span>
		<span class="flex min-w-0 flex-col gap-0.5">
			<span class="flex items-center gap-1.5 font-display text-white"
				><Hand class="size-4" strokeWidth={3} />{m.task_form_on_demand()}</span
			>
			<span class="text-xs font-bold text-night-300">{m.task_form_on_demand_hint()}</span>
		</span>
	</label>

	<!-- kept in the DOM (just hidden) so the previous recurrence survives a toggle -->
	<div class="grid grid-cols-2 gap-3" hidden={onDemand}>
		<label class="field">
			<span class="field-label">{m.task_form_frequency()}</span>
			<input
				name="frequency"
				type="number"
				min="1"
				inputmode="numeric"
				required={!onDemand}
				value={initial.frequency}
				class="input"
			/>
		</label>
		<label class="field">
			<span class="field-label">{m.task_form_unit()}</span>
			<select name="unit" class="input">
				<option value="day" selected={initial.unit === 'day'}>{m.task_form_unit_day()}</option>
				<option value="week" selected={initial.unit === 'week'}>{m.task_form_unit_week()}</option>
				<option value="month" selected={initial.unit === 'month'}>{m.task_form_unit_month()}</option>
				<option value="year" selected={initial.unit === 'year'}>{m.task_form_unit_year()}</option>
			</select>
		</label>
	</div>

	<label class="field">
		<span class="field-label">{m.task_form_score()}</span>
		<span class="relative">
			<Coin class="pointer-events-none absolute top-1/2 left-3 size-6 -translate-y-1/2" />
			<input
				name="score"
				type="number"
				min="0"
				inputmode="numeric"
				required
				value={initial.score}
				class="input pl-11 font-display text-lg text-gold-200"
			/>
		</span>
		<span class="px-1 text-xs font-bold text-night-300">{m.task_form_score_hint()}</span>
	</label>

	<button type="submit" class="btn btn-gold btn-block shine mt-1">
		<Check class="size-5" strokeWidth={3.5} />
		{submitLabel ?? m.task_form_save()}
	</button>
</form>
