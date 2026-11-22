<script lang="ts">
	import { enhance } from '$app/forms';
	import { ChevronLeft, Pencil, Trash, TriangleAlert } from '@lucide/svelte';
	import MealForm from '$lib/MealForm.svelte';
	import { mealPhotoUrl } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="mx-auto flex max-w-md flex-col gap-4">
	<a href="/meals/library" class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{m.meals_back_to_library()}
	</a>
	<PageHeader title={m.meal_edit_title()} eyebrow={data.meal.name} icon={Pencil} />

	<section class="panel p-4 sm:p-5">
		{#key data.meal.id}
			<MealForm
				action="?/update"
				initial={{
					...(form && 'name' in form && form.name !== undefined
						? { name: form.name, difficulty: form.difficulty, prep_minutes: form.prep_minutes }
						: { name: data.meal.name, difficulty: data.meal.difficulty, prep_minutes: data.meal.prep_minutes }),
					photoUrl: mealPhotoUrl(data.meal, 'card')
				}}
				error={form && 'name' in form ? form.message : undefined}
			/>
		{/key}
	</section>

	<form
		method="post"
		action="?/delete"
		use:enhance={({ cancel }) => {
			if (!confirm(m.meal_edit_delete_confirm())) cancel();
		}}
		class="panel-inset flex flex-col gap-2 border-dashed border-rose-500/60 p-3"
	>
		{#if form && !('name' in form) && form.message}
			<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
		{/if}
		<button type="submit" class="btn btn-red btn-sm btn-block">
			<Trash class="size-4" strokeWidth={3} />{m.meal_edit_delete()}
		</button>
	</form>
</div>
