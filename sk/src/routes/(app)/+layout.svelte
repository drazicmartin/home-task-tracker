<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const links = [
		{ href: '/board', label: 'Tâches' },
		{ href: '/leaderboard', label: 'Classement' },
		{ href: '/history', label: 'Historique' }
	];
</script>

<div class="min-h-screen bg-stone-50">
	<header class="border-b border-stone-200 bg-white">
		<nav class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
			<div class="flex items-center gap-6">
				<span class="font-bold text-stone-900">HTT</span>
				{#if data.activeHousehold}
					<div class="flex gap-1">
						{#each links as link (link.href)}
							<a
								href={link.href}
								class="rounded-full px-3 py-1.5 text-sm font-medium transition {page.url.pathname === link.href
									? 'bg-stone-900 text-white'
									: 'text-stone-600 hover:bg-stone-100'}"
							>
								{link.label}
							</a>
						{/each}
					</div>
				{/if}
			</div>
			<div class="flex items-center gap-3">
				{#if data.activeHousehold}
					<span class="text-sm text-stone-500">{data.activeHousehold.name}</span>
				{/if}
				<a href="/account" class="text-sm text-stone-600 hover:text-stone-900">Compte</a>
				<form method="post" action="/logout">
					<button type="submit" class="text-sm text-stone-600 hover:text-stone-900">Déconnexion</button>
				</form>
			</div>
		</nav>
	</header>

	<main class="mx-auto max-w-4xl px-4 py-8">
		{@render children()}
	</main>
</div>
