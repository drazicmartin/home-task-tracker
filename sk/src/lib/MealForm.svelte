<script lang="ts">
	import { enhance } from '$app/forms';
	import { Camera, Check, ChefHat, Clock, ImagePlus, LoaderCircle, Trash, TriangleAlert, UtensilsCrossed } from '@lucide/svelte';
	import { downscaleImage, setInputFile } from '$lib/imageResize';
	import { DIFFICULTY_LABELS } from '$lib/mealUi';
	import { difficultyLevel, MAX_PREP_MINUTES, MEAL_DIFFICULTIES, PREP_TIME_PRESETS, type MealDifficulty } from '$lib/meals';
	import * as m from '$lib/paraglide/messages.js';

	/**
	 * Dish form shared by "new dish" and "edit dish": a photo of the finished
	 * dish (taken with the camera or picked from the gallery, shrunk in the
	 * browser before upload), its name, difficulty and preparation time.
	 */
	let {
		action,
		initial = { name: '', difficulty: 'easy', prep_minutes: 30, photoUrl: '' },
		error,
		submitLabel,
		hidden = {},
		autofocus = false
	}: {
		action: string;
		initial?: { name: string; difficulty: MealDifficulty; prep_minutes: number; photoUrl?: string };
		error?: string;
		submitLabel?: string;
		/** Extra hidden fields posted with the form (e.g. the plan slot to fill). */
		hidden?: Record<string, string>;
		autofocus?: boolean;
	} = $props();

	let cameraInput = $state<HTMLInputElement>();
	let galleryInput = $state<HTMLInputElement>();
	let nameInput = $state<HTMLInputElement>();

	// svelte-ignore state_referenced_locally -- seeded once from the initial values, then owned by the form
	let difficulty = $state<MealDifficulty>(initial.difficulty);
	// svelte-ignore state_referenced_locally
	let minutes = $state<number | null>(initial.prep_minutes || null);
	// svelte-ignore state_referenced_locally
	let preview = $state(initial.photoUrl ?? '');
	let removePhoto = $state(false);
	let processing = $state(false);
	let submitting = $state(false);
	let objectUrl: string | null = null;

	function showPreview(file: File | null) {
		if (objectUrl) URL.revokeObjectURL(objectUrl);
		objectUrl = file ? URL.createObjectURL(file) : null;
		preview = objectUrl ?? '';
	}

	async function onPhotoPicked(input: HTMLInputElement | undefined, other: HTMLInputElement | undefined) {
		const file = input?.files?.[0];
		if (!input || !file) return;
		// only one photo is posted: the other input is emptied
		if (other) other.value = '';
		removePhoto = false;
		processing = true;
		try {
			const small = await downscaleImage(file);
			if (small !== file) setInputFile(input, small);
			showPreview(input.files?.[0] ?? file);
		} finally {
			processing = false;
		}
	}

	function clearPhoto() {
		if (cameraInput) cameraInput.value = '';
		if (galleryInput) galleryInput.value = '';
		showPreview(null);
		removePhoto = true;
	}

	$effect(() => {
		if (autofocus && nameInput) nameInput.focus();
		return () => {
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	});
</script>

<form
	method="post"
	{action}
	enctype="multipart/form-data"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update({ reset: false });
		};
	}}
	class="flex flex-col gap-4"
>
	{#if error}
		<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{error}</p>
	{/if}

	{#each Object.entries(hidden) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	{#if removePhoto}
		<input type="hidden" name="remove_photo" value="1" />
	{/if}

	<!-- Photo of the finished dish -->
	<div class="field">
		<span class="field-label">{m.meal_form_photo()}</span>
		<div class="photo-frame panel-inset">
			{#if preview}
				<img src={preview} alt={m.meal_form_photo()} class="absolute inset-0 size-full object-cover" />
			{:else}
				<span class="flex flex-col items-center gap-2 px-6 text-center text-night-300">
					<UtensilsCrossed class="size-10" strokeWidth={2.25} />
					<span class="text-sm font-bold">{m.meal_form_photo_hint()}</span>
				</span>
			{/if}
			{#if processing}
				<span class="absolute inset-0 grid place-items-center bg-night-950/60 text-white">
					<span class="flex items-center gap-2 font-display"
						><LoaderCircle class="size-5 animate-spin" strokeWidth={3} />{m.meal_form_processing()}</span
					>
				</span>
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-2">
			<!-- capture: opens the camera straight away on phones -->
			<label class="btn btn-blue btn-sm photo-btn">
				<input
					bind:this={cameraInput}
					type="file"
					name="photo"
					accept="image/*"
					capture="environment"
					class="sr-only"
					onchange={() => onPhotoPicked(cameraInput, galleryInput)}
				/>
				<Camera class="size-4 shrink-0" strokeWidth={3} />{m.meal_form_take_photo()}
			</label>
			<label class="btn btn-sm photo-btn">
				<input
					bind:this={galleryInput}
					type="file"
					name="photo"
					accept="image/*"
					class="sr-only"
					onchange={() => onPhotoPicked(galleryInput, cameraInput)}
				/>
				<ImagePlus class="size-4 shrink-0" strokeWidth={3} />{m.meal_form_pick_photo()}
			</label>
		</div>
		{#if preview}
			<button type="button" onclick={clearPhoto} class="btn btn-sm btn-red self-start">
				<Trash class="size-4" strokeWidth={3} />{m.meal_form_remove_photo()}
			</button>
		{/if}
	</div>

	<label class="field">
		<span class="field-label">{m.meal_form_name()}</span>
		<input
			bind:this={nameInput}
			name="name"
			type="text"
			required
			maxlength="150"
			autocomplete="off"
			value={initial.name}
			placeholder={m.meal_form_name_placeholder()}
			class="input"
		/>
	</label>

	<fieldset class="field">
		<legend class="field-label mb-1.5">{m.meal_form_difficulty()}</legend>
		<div class="panel-inset grid grid-cols-3 gap-1 p-1">
			{#each MEAL_DIFFICULTIES as option (option)}
				{@const level = difficultyLevel(option)}
				<label class="segment segment-{option}">
					<input type="radio" name="difficulty" value={option} bind:group={difficulty} class="sr-only" />
					<span class="flex" aria-hidden="true">
						{#each [1, 2, 3] as pip (pip)}
							<ChefHat class="size-3.5 {pip > level ? 'opacity-30' : ''}" strokeWidth={3} />
						{/each}
					</span>
					{DIFFICULTY_LABELS[option]()}
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="field">
		<label class="field-label" for="meal-prep-minutes">{m.meal_form_time()}</label>
		<span class="relative">
			<Clock class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-night-300" strokeWidth={3} />
			<input
				id="meal-prep-minutes"
				name="prep_minutes"
				type="number"
				min="0"
				max={MAX_PREP_MINUTES}
				step="5"
				inputmode="numeric"
				bind:value={minutes}
				class="input pr-14 pl-10"
			/>
			<span class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-extrabold text-night-300"
				>{m.meal_form_minutes()}</span
			>
		</span>
		<div class="flex flex-wrap gap-1.5" role="group" aria-label={m.meal_form_time()}>
			{#each PREP_TIME_PRESETS as preset (preset)}
				<button
					type="button"
					class="preset"
					aria-pressed={minutes === preset}
					onclick={() => (minutes = preset)}>{preset} {m.meal_form_minutes()}</button
				>
			{/each}
		</div>
		<span class="px-1 text-xs font-bold text-night-300">{m.meal_form_time_hint()}</span>
	</div>

	<button type="submit" class="btn btn-gold btn-block shine mt-1" disabled={processing || submitting}>
		{#if submitting}
			<LoaderCircle class="size-5 animate-spin" strokeWidth={3.5} />
		{:else}
			<Check class="size-5" strokeWidth={3.5} />
		{/if}
		{submitLabel ?? m.meal_form_save()}
	</button>
</form>

<style>
	.photo-frame {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-style: dashed;
		border-color: var(--color-night-500);
	}
	.photo-btn:has(input:focus-visible) {
		outline: 3px solid var(--color-gold-300);
		outline-offset: 2px;
	}

	/* same look as the household settings' timeline length toggle */
	.segment {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		min-height: 3.25rem;
		padding: 0.3rem 0.25rem;
		border-radius: 0.75rem;
		border: 3px solid transparent;
		color: var(--color-night-200);
		font-size: 0.85rem;
		font-weight: 900;
		line-height: 1.1;
		text-align: center;
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.segment:hover {
		color: white;
	}
	.segment:has(input:focus-visible) {
		outline: 3px solid var(--color-gold-300);
		outline-offset: 1px;
	}
	.segment:has(input:checked) {
		border-color: var(--color-night-950);
		color: white;
		box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.35);
	}
	.segment-easy:has(input:checked) {
		background: linear-gradient(180deg, #22c55e, #15803d);
	}
	.segment-medium:has(input:checked) {
		background: linear-gradient(180deg, #f59e0b, #b45309);
	}
	.segment-hard:has(input:checked) {
		background: linear-gradient(180deg, #f43f5e, #be123c);
	}

	.preset {
		min-height: 2.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: rgb(11 7 32 / 0.45);
		color: var(--color-night-100);
		font-size: 0.85rem;
		font-weight: 900;
		cursor: pointer;
		transition: background 0.15s;
	}
	.preset:hover {
		background: rgb(11 7 32 / 0.7);
	}
	.preset[aria-pressed='true'] {
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
	}
</style>
