<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Toaster richColors position="top-center" />

{@render children()}
