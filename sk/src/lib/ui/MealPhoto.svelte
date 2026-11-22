<script lang="ts">
	import { UtensilsCrossed } from '@lucide/svelte';
	import { avatarHue } from '$lib/game';
	import { mealPhotoUrl, type Meal, type MealPhotoSize } from '$lib/meals';

	/**
	 * A dish's photo, or — when it has none, or it fails to load — a plate
	 * tile tinted from the dish's name, so every dish still looks distinct.
	 * Decorative: the dish name is always shown as text next to it.
	 */
	let {
		meal,
		size = 'thumb',
		cover = false,
		class: className = 'size-14'
	}: {
		meal: Pick<Meal, 'id' | 'name' | 'photo'>;
		size?: MealPhotoSize;
		/** Full-bleed header image of a card: no rounded frame of its own, just a bottom edge. */
		cover?: boolean;
		class?: string;
	} = $props();

	const src = $derived(mealPhotoUrl(meal, size));
	let failedSrc = $state('');
</script>

<span class="photo {className}" data-cover={cover} style="--hue: {avatarHue(meal.name || meal.id)}" aria-hidden="true">
	{#if src && failedSrc !== src}
		<img {src} alt="" loading="lazy" decoding="async" onerror={() => (failedSrc = src)} />
	{:else}
		<UtensilsCrossed class="size-[42%] max-h-10 max-w-10" strokeWidth={2.5} />
	{/if}
</span>

<style>
	.photo {
		position: relative;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		overflow: hidden;
		border-radius: 1rem;
		border: 3px solid var(--color-night-950);
		background: linear-gradient(180deg, hsl(var(--hue) 70% 58%), hsl(var(--hue) 60% 36%));
		color: rgb(255 255 255 / 0.85);
		box-shadow:
			inset 0 3px 0 rgb(255 255 255 / 0.3),
			0 3px 0 var(--color-night-950);
	}
	.photo[data-cover='true'] {
		border-radius: 0;
		border-width: 0 0 3px;
		box-shadow: none;
	}
	img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
