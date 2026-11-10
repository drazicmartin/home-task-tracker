<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	/** An "empty inventory slot": dashed inset panel with a floating icon. */
	let { icon: Icon, message, children }: { icon: LucideIcon; message: string; children?: Snippet } = $props();
</script>

<div class="panel-inset flex flex-col items-center gap-4 border-dashed border-night-500 px-6 py-10 text-center">
	<span class="grid size-16 animate-float place-items-center rounded-2xl border-[3px] border-night-950 bg-night-700">
		<Icon class="size-8 text-night-300" strokeWidth={2.5} />
	</span>
	<p class="max-w-xs font-bold text-night-200">{message}</p>
	{@render children?.()}
</div>
