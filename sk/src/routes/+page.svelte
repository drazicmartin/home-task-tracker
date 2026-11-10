<script lang="ts">
	import { ChartColumn, Sparkles, Star, Swords, Trophy } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import Coin from '$lib/ui/Coin.svelte';
	import Logo from '$lib/ui/Logo.svelte';

	// Floating decorations around the title (position, size, timing)
	const decorations = [
		{ kind: 'coin', style: 'left: 6%; top: 11%; width: 2.6rem; animation-delay: -1s' },
		{ kind: 'star', style: 'right: 8%; top: 19%; width: 2rem; animation-delay: -3s' },
		{ kind: 'coin', style: 'right: 7%; bottom: 7%; width: 2.2rem; animation-delay: -2s' },
		{ kind: 'sparkle', style: 'left: 8%; bottom: 9%; width: 1.8rem; animation-delay: -4s' },
		{ kind: 'star', style: 'left: 46%; top: 5%; width: 1.3rem; animation-delay: -5s' }
	];
</script>

<main
	class="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-6 pt-[calc(3rem_+_env(safe-area-inset-top))] pb-[calc(3rem_+_env(safe-area-inset-bottom))] text-center"
>
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		{#each decorations as deco, i (i)}
			<span class="absolute aspect-square animate-float" style={deco.style}>
				{#if deco.kind === 'coin'}
					<Coin class="size-full" />
				{:else if deco.kind === 'star'}
					<Star class="size-full text-gold-300 drop-shadow-[0_3px_0_var(--color-night-950)]" fill="currentColor" strokeWidth={2} />
				{:else}
					<Sparkles class="size-full text-pink-300 drop-shadow-[0_3px_0_var(--color-night-950)]" strokeWidth={2.5} />
				{/if}
			</span>
		{/each}
	</div>

	<div class="animate-pop-in">
		<Logo />
	</div>

	<p class="max-w-md text-lg leading-snug font-bold text-night-100">{m.landing_pitch()}</p>

	<ul class="flex flex-wrap justify-center gap-2" aria-hidden="true">
		<li class="chip px-3 py-1 text-xs"><Swords class="size-3.5" strokeWidth={3} />{m.nav_tasks()}</li>
		<li class="chip px-3 py-1 text-xs"><Trophy class="size-3.5" strokeWidth={3} />{m.nav_leaderboard()}</li>
		<li class="chip px-3 py-1 text-xs"><ChartColumn class="size-3.5" strokeWidth={3} />{m.nav_dashboard()}</li>
	</ul>

	<div class="flex w-full max-w-xs flex-col gap-3">
		<a href="/signup" class="btn btn-gold btn-block shine min-h-14 text-xl">{m.landing_signup()}</a>
		<a href="/login" class="btn btn-blue btn-block">{m.landing_login()}</a>
	</div>
</main>
