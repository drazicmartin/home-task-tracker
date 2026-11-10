<script lang="ts">
	import { ChevronLeft, Copy } from '@lucide/svelte';
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
	<PageHeader title={m.task_duplicate_title()} eyebrow={data.task.name} icon={Copy} />

	<section class="panel p-4 sm:p-5">
		<TaskForm
			action="?/create"
			initial={form?.name !== undefined
				? form
				: {
						name: m.task_duplicate_name({ name: data.task.name }),
						description: data.task.description,
						frequency: data.task.frequency,
						unit: data.task.unit,
						score: data.task.score,
						on_demand: data.task.on_demand
					}}
			error={form?.message}
			submitLabel={m.task_duplicate_create()}
			autofocus
		/>
	</section>
</div>
