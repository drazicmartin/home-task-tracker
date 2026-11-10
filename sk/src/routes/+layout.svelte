<script lang="ts">
	import '@fontsource/lilita-one';
	import '@fontsource-variable/nunito';
	import { Toaster } from 'svelte-sonner';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Toaster richColors theme="dark" position="top-center" />

{@render children()}
