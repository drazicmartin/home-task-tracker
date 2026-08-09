<script lang="ts">
	import TaskForm from '$lib/TaskForm.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto max-w-md">
	<a href="/board" class="text-sm text-stone-500 underline">{m.back_to_board()}</a>
	<h1 class="mt-2 mb-6 text-2xl font-bold text-stone-900">{m.task_new_title()}</h1>
	<TaskForm
		action=""
		initial={form ? { name: form.name, description: form.description, frequency: form.frequency, unit: form.unit, score: form.score } : undefined}
		error={form?.message}
		submitLabel={m.task_new_create()}
	/>
</div>
