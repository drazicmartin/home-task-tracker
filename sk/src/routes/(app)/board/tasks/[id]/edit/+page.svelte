<script lang="ts">
	import { enhance } from '$app/forms';
	import TaskForm from '$lib/TaskForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function confirmDelete(event: SubmitEvent) {
		if (!confirm('Supprimer définitivement cette tâche ? Son historique de complétion sera conservé.')) {
			event.preventDefault();
		}
	}
</script>

<div class="mx-auto max-w-md">
	<a href="/board" class="text-sm text-stone-500 underline">&larr; Retour au tableau</a>
	<h1 class="mt-2 mb-6 text-2xl font-bold text-stone-900">Modifier la tâche</h1>

	<TaskForm
		action="?/update"
		initial={
			form
				? { name: form.name, description: form.description, frequency: form.frequency, unit: form.unit, score: form.score }
				: { name: data.task.name, description: data.task.description, frequency: data.task.frequency, unit: data.task.unit, score: data.task.score }
		}
		error={form?.message}
	/>

	<form method="post" action="?/delete" use:enhance onsubmit={confirmDelete} class="mt-4">
		<button type="submit" class="text-sm text-red-600 hover:underline">Supprimer cette tâche</button>
	</form>
</div>
