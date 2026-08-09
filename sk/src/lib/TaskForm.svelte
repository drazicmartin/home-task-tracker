<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		action,
		initial = { name: '', description: '', frequency: 1, unit: 'week', score: 1 },
		error,
		submitLabel = 'Enregistrer'
	}: {
		action: string;
		initial?: { name: string; description: string; frequency: number; unit: string; score: number };
		error?: string;
		submitLabel?: string;
	} = $props();
</script>

<form method="post" {action} use:enhance class="flex flex-col gap-4">
	{#if error}
		<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
	{/if}

	<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
		Nom
		<input name="name" type="text" required value={initial.name} class="rounded-lg border border-stone-300 px-3 py-2" />
	</label>

	<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
		Description
		<textarea name="description" rows="3" class="rounded-lg border border-stone-300 px-3 py-2">{initial.description}</textarea>
	</label>

	<div class="grid grid-cols-2 gap-3">
		<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
			Fréquence
			<input
				name="frequency"
				type="number"
				min="1"
				required
				value={initial.frequency}
				class="rounded-lg border border-stone-300 px-3 py-2"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
			Unité
			<select name="unit" class="rounded-lg border border-stone-300 px-3 py-2">
				<option value="day" selected={initial.unit === 'day'}>jour(s)</option>
				<option value="week" selected={initial.unit === 'week'}>semaine(s)</option>
				<option value="month" selected={initial.unit === 'month'}>mois</option>
				<option value="year" selected={initial.unit === 'year'}>année(s)</option>
			</select>
		</label>
	</div>

	<label class="flex flex-col gap-1 text-sm font-medium text-stone-700">
		Points
		<input name="score" type="number" min="0" required value={initial.score} class="rounded-lg border border-stone-300 px-3 py-2" />
	</label>

	<div class="flex justify-end">
		<button type="submit" class="rounded-full bg-stone-900 px-6 py-2.5 font-medium text-white hover:bg-stone-700">
			{submitLabel}
		</button>
	</div>
</form>
