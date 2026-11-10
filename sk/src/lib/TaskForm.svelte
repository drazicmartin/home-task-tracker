<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, TriangleAlert } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import Coin from '$lib/ui/Coin.svelte';

	let {
		action,
		initial = { name: '', description: '', frequency: 1, unit: 'week', score: 1 },
		error,
		submitLabel
	}: {
		action: string;
		initial?: { name: string; description: string; frequency: number; unit: string; score: number };
		error?: string;
		submitLabel?: string;
	} = $props();
</script>

<form method="post" {action} use:enhance class="flex flex-col gap-4">
	{#if error}
		<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{error}</p>
	{/if}

	<label class="field">
		<span class="field-label">{m.task_form_name()}</span>
		<input name="name" type="text" required value={initial.name} class="input" />
	</label>

	<label class="field">
		<span class="field-label">{m.task_form_description()}</span>
		<textarea name="description" rows="3" class="input">{initial.description}</textarea>
	</label>

	<div class="grid grid-cols-2 gap-3">
		<label class="field">
			<span class="field-label">{m.task_form_frequency()}</span>
			<input
				name="frequency"
				type="number"
				min="1"
				inputmode="numeric"
				required
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
