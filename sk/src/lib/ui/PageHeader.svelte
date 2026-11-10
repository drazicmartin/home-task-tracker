<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	/**
	 * Screen title in the game style: an icon badge, an optional "zone" caption
	 * above (e.g. the household name), and action buttons on the right.
	 */
	let {
		title,
		eyebrow,
		icon: Icon,
		actions
	}: { title: string; eyebrow?: string; icon?: LucideIcon; actions?: Snippet } = $props();
</script>

<header class="flex items-center justify-between gap-3">
	<div class="flex min-w-0 items-center gap-3">
		{#if Icon}
			<span
				class="grid size-12 shrink-0 place-items-center rounded-2xl border-[3px] border-night-950 bg-gradient-to-b from-gold-300 to-gold-500 text-gold-900 shadow-[inset_0_3px_0_rgb(255_255_255/0.5),inset_0_-4px_0_var(--color-gold-600),0_4px_0_var(--color-night-950)]"
			>
				<Icon class="size-6" strokeWidth={2.75} />
			</span>
		{/if}
		<div class="min-w-0">
			{#if eyebrow}
				<p class="truncate text-xs font-black tracking-wider text-night-300 uppercase">{eyebrow}</p>
			{/if}
			<h1 class="text-outline truncate font-display text-[1.75rem] leading-tight text-white sm:text-4xl">
				{title}
			</h1>
		</div>
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</header>
