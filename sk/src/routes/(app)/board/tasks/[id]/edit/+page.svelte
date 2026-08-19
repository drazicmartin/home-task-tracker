<script lang="ts">
	import { enhance } from '$app/forms';
	import TaskForm from '$lib/TaskForm.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="mx-auto max-w-md">
	<a href="/board" class="text-sm text-stone-500 underline">{m.back_to_board()}</a>
	<h1 class="mt-2 mb-6 text-2xl font-bold text-stone-900">{m.task_edit_title()}</h1>

	<TaskForm
		action="?/update"
		initial={
			form
				? { name: form.name, description: form.description, frequency: form.frequency, unit: form.unit, score: form.score }
				: { name: data.task.name, description: data.task.description, frequency: data.task.frequency, unit: data.task.unit, score: data.task.score }
		}
		error={form?.message}
	/>

	<form
		method="post"
		action="?/delete"
		use:enhance={({ cancel }) => {
			if (!confirm(m.task_edit_delete_confirm())) {
				cancel();
			}
		}}
		class="mt-4"
	>
		<button type="submit" class="text-sm text-red-600 hover:underline">{m.task_edit_delete()}</button>
	</form>
</div>
