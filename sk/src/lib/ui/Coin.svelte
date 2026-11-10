<script lang="ts">
	/** A chunky gold coin — the in-game currency icon for points. */
	let { class: className = 'size-5' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 24 24" class="shrink-0 {className}" aria-hidden="true">
	<circle cx="12" cy="12" r="10.5" fill="#0b0720" />
	<circle cx="12" cy="12" r="9" fill="#c97a00" />
	<circle cx="12" cy="11" r="8" fill="#ffcd38" />
	<circle cx="12" cy="11" r="5.9" fill="none" stroke="#e39a00" stroke-width="1.3" />
	<path
		d="M12 7.4 12.94 9.91 15.61 10.03 13.52 11.69 14.23 14.27 12 12.8 9.77 14.27 10.48 11.69 8.39 10.03 11.06 9.91Z"
		fill="#fff1b8"
		stroke="#c97a00"
		stroke-width="0.9"
		stroke-linejoin="round"
	/>
	<path d="M6.3 8.6a6.6 6.6 0 0 1 3.6-3.8" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.85" />
</svg>
