<script lang="ts">
	import { avatarHue, initials } from '$lib/game';

	/**
	 * A player portrait: initials on a color picked from the user's id, so the
	 * same person always looks the same across the board, leaderboard and log.
	 * Purely decorative — the name is always shown as text next to it.
	 */
	let {
		name,
		seed,
		level,
		class: className = 'size-12 text-lg'
	}: { name: string; seed?: string; level?: number; class?: string } = $props();
</script>

<span class="avatar text-outline {className}" style="--hue: {avatarHue(seed ?? name)}" aria-hidden="true">
	{initials(name)}
	{#if level !== undefined}
		<span class="avatar-level">{level}</span>
	{/if}
</span>

<style>
	.avatar {
		position: relative;
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		border-radius: 32%;
		border: 3px solid var(--color-night-950);
		background: linear-gradient(180deg, hsl(var(--hue) 78% 64%), hsl(var(--hue) 62% 42%));
		color: white;
		font-family: var(--font-display);
		line-height: 1;
		box-shadow:
			inset 0 3px 0 rgb(255 255 255 / 0.35),
			inset 0 -4px 0 hsl(var(--hue) 62% 28%),
			0 3px 0 var(--color-night-950);
	}

	.avatar-level {
		position: absolute;
		right: -0.5rem;
		bottom: -0.45rem;
		display: grid;
		place-items: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		border: 2.5px solid var(--color-night-950);
		background: linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500));
		color: var(--color-gold-900);
		font-size: 0.8rem;
		text-shadow: none;
	}
</style>
