<script lang="ts">
	import { enhance } from '$app/forms';
	import { ChevronLeft, Copy, Pencil, Trash } from '@lucide/svelte';
	import TaskForm from '$lib/TaskForm.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<a href="/board" class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{m.back_to_board()}
	</a>
	<PageHeader title={m.task_edit_title()} eyebrow={data.task.name} icon={Pencil}>
		{#snippet actions()}
			<a href="/board/tasks/{data.task.id}/duplicate" class="btn btn-sm">
				<Copy class="size-4" strokeWidth={3} />{m.task_duplicate()}
			</a>
		{/snippet}
	</PageHeader>

	<section class="panel p-4 sm:p-5">
		<TaskForm
			action="?/update"
			initial={form
				? { name: form.name, description: form.description, frequency: form.frequency, unit: form.unit, score: form.score }
				: {
						name: data.task.name,
						description: data.task.description,
						frequency: data.task.frequency,
						unit: data.task.unit,
						score: data.task.score
					}}
			error={form?.message}
		/>
	</section>

	<form
		method="post"
		action="?/delete"
		use:enhance={({ cancel }) => {
			if (!confirm(m.task_edit_delete_confirm())) {
				cancel();
			}
		}}
		class="panel-inset border-dashed border-rose-500/60 p-3"
	>
		<button type="submit" class="btn btn-red btn-sm btn-block">
			<Trash class="size-4" strokeWidth={3} />{m.task_edit_delete()}
		</button>
	</form>
</div>
