<script lang="ts">
	import { ChevronLeft, Plus } from '@lucide/svelte';
	import TaskForm from '$lib/TaskForm.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<a href="/board" class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{m.back_to_board()}
	</a>
	<PageHeader title={m.task_new_title()} icon={Plus} />
	<section class="panel p-4 sm:p-5">
		<TaskForm
			action=""
			initial={form
				? { name: form.name, description: form.description, frequency: form.frequency, unit: form.unit, score: form.score }
				: undefined}
			error={form?.message}
			submitLabel={m.task_new_create()}
		/>
	</section>
</div>
