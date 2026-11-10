<script lang="ts">
	import { formatPoints, levelInfo } from '$lib/game';
	import * as m from '$lib/paraglide/messages.js';

	let { points, class: className = '' }: { points: number; class?: string } = $props();

	const info = $derived(levelInfo(points));
</script>

<div class="flex items-center gap-2 {className}">
	<div
		class="meter flex-1"
		role="progressbar"
		aria-label={m.hud_level({ level: info.level })}
		aria-valuemin={0}
		aria-valuemax={info.needed}
		aria-valuenow={info.current}
	>
		<div class="meter-fill" style="width: {info.progress * 100}%"></div>
	</div>
	<span class="shrink-0 text-[0.7rem] font-black text-night-200 tabular-nums max-[359px]:hidden">
		{m.hud_xp({ current: formatPoints(info.current), needed: info.needed })}
	</span>
</div>
