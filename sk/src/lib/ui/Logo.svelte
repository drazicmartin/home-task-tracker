<script lang="ts">
	import { House } from '@lucide/svelte';
	import Coin from './Coin.svelte';

	/**
	 * Title-screen logo. `size="sm"` is used above the login/signup panels,
	 * where the page has its own <h1> — pass `tag="div"` there.
	 */
	let { size = 'lg', tag = 'h1' }: { size?: 'sm' | 'lg'; tag?: 'h1' | 'div' } = $props();
</script>

<div class="logo logo-{size}">
	<div class="badge">
		<House class="house" strokeWidth={2.75} />
		<span class="coin"><Coin class="size-full" /></span>
	</div>
	<svelte:element this={tag} class="wordmark font-display">
		<span class="line1">Home Task</span>{' '}<span class="line2">Tracker</span>
	</svelte:element>
</div>

<style>
	.logo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.badge {
		position: relative;
		display: grid;
		place-items: center;
		width: 6rem;
		height: 6rem;
		border-radius: 1.75rem;
		border: 4px solid var(--color-night-950);
		background: linear-gradient(180deg, #8b6cff, #5b3fd6);
		color: white;
		rotate: -6deg;
		box-shadow:
			inset 0 4px 0 rgb(255 255 255 / 0.35),
			inset 0 -6px 0 #3a2596,
			0 6px 0 var(--color-night-950),
			0 20px 40px -10px rgb(139 92 246 / 0.8);
	}
	.badge :global(.house) {
		width: 3.25rem;
		height: 3.25rem;
		filter: drop-shadow(0 3px 0 var(--color-night-950));
	}
	.coin {
		position: absolute;
		right: -0.9rem;
		bottom: -0.7rem;
		width: 2.75rem;
		height: 2.75rem;
		rotate: 12deg;
		animation: bob 1.6s ease-in-out infinite;
	}

	.wordmark {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 0.9;
		text-align: center;
		/* outline that works with gradient-clipped text (text-shadow doesn't) */
		filter: drop-shadow(0 4px 0 var(--color-night-950)) drop-shadow(2px 0 0 var(--color-night-950))
			drop-shadow(-2px 0 0 var(--color-night-950)) drop-shadow(0 -2px 0 var(--color-night-950));
	}
	.line1 {
		font-size: 1.6rem;
		letter-spacing: 0.06em;
		color: white;
	}
	.line2 {
		font-size: 3.4rem;
		letter-spacing: 0.02em;
		background: linear-gradient(180deg, var(--color-gold-200) 10%, var(--color-gold-400) 50%, var(--color-gold-500) 51%, #ff9e00);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.logo-sm {
		flex-direction: row;
		gap: 1rem;
	}
	.logo-sm .badge {
		width: 3.75rem;
		height: 3.75rem;
		border-radius: 1.15rem;
		border-width: 3px;
	}
	.logo-sm .badge :global(.house) {
		width: 2rem;
		height: 2rem;
	}
	.logo-sm .coin {
		width: 1.75rem;
		height: 1.75rem;
		right: -0.6rem;
		bottom: -0.5rem;
	}
	.logo-sm .wordmark {
		align-items: flex-start;
		text-align: left;
	}
	.logo-sm .line1 {
		font-size: 1.05rem;
	}
	.logo-sm .line2 {
		font-size: 2.1rem;
	}
</style>
