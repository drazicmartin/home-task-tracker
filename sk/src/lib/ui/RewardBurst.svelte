<script lang="ts">
	import Coin from './Coin.svelte';

	/**
	 * Full-screen "victory" pop shown when a quest is claimed: spinning light
	 * rays, a coin, the points earned and confetti. Purely decorative (the
	 * toast carries the same info for screen readers) and click-through.
	 */
	let { points, label }: { points: string; label: string } = $props();

	const particles = Array.from({ length: 16 }, (_, i) => ({
		angle: (360 / 16) * i + (i % 2 ? 9 : -9),
		distance: 110 + (i % 3) * 36,
		delay: (i % 4) * 35,
		kind: i % 3
	}));
</script>

<div class="burst" aria-hidden="true">
	<div class="rays"></div>
	<div class="core">
		{#each particles as p, i (i)}
			<span
				class="particle particle-{p.kind}"
				style="--angle: {p.angle}deg; --distance: {p.distance}px; --delay: {p.delay}ms"
			></span>
		{/each}
		<div class="coin"><Coin class="size-28" /></div>
		<div class="points text-outline font-display">+{points}</div>
		<div class="label ribbon">{label}</div>
	</div>
</div>

<style>
	.burst {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: center;
		pointer-events: none;
		background: radial-gradient(circle, rgb(11 7 32 / 0.55), rgb(11 7 32 / 0) 70%);
		animation: burst-fade 2s ease-in forwards;
	}

	.rays {
		position: absolute;
		width: 36rem;
		height: 36rem;
		border-radius: 50%;
		background: repeating-conic-gradient(rgb(255 224 102 / 0.3) 0deg 10deg, transparent 10deg 30deg);
		mask-image: radial-gradient(circle, black 15%, transparent 65%);
		animation:
			pop-in 0.4s cubic-bezier(0.2, 1.5, 0.4, 1) both,
			spin 7s linear infinite;
	}

	.core {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.coin {
		filter: drop-shadow(0 6px 0 var(--color-night-950));
		animation: coin-pop 0.7s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}

	.points {
		font-size: 4.5rem;
		line-height: 1;
		color: var(--color-gold-300);
		animation: points-rise 0.6s 0.1s cubic-bezier(0.2, 1.4, 0.4, 1) both;
	}

	.label {
		margin-top: 0.5rem;
		font-size: 1.35rem;
		animation: pop-in 0.4s 0.25s cubic-bezier(0.2, 1.5, 0.4, 1) both;
	}

	.particle {
		position: absolute;
		left: 50%;
		top: 3.5rem;
		width: 0.8rem;
		height: 0.8rem;
		margin: -0.4rem;
		border: 2px solid var(--color-night-950);
		border-radius: 3px;
		background: var(--color-gold-300);
		animation: particle-fly 1s var(--delay) cubic-bezier(0.1, 0.8, 0.3, 1) both;
	}
	.particle-1 {
		border-radius: 50%;
		background: #f472b6;
	}
	.particle-2 {
		background: #5eead4;
	}

	@keyframes burst-fade {
		0%,
		75% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@keyframes coin-pop {
		0% {
			transform: scale(0) rotate(-40deg);
		}
		60% {
			transform: scale(1.15) rotate(10deg);
		}
		100% {
			transform: scale(1) rotate(0);
		}
	}
	@keyframes points-rise {
		from {
			opacity: 0;
			transform: translateY(24px) scale(0.6);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@keyframes particle-fly {
		0% {
			opacity: 1;
			transform: rotate(var(--angle)) translateY(0) scale(0.4);
		}
		100% {
			opacity: 0;
			transform: rotate(var(--angle)) translateY(calc(var(--distance) * -1)) rotate(200deg) scale(1);
		}
	}
</style>
