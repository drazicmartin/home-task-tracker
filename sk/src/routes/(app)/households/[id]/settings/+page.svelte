<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function inviteUrl(code: string): string {
		return `${page.url.origin}/invite/${code}`;
	}

	async function copyInvite(code: string) {
		await navigator.clipboard.writeText(inviteUrl(code));
		toast.success('Lien copié !');
	}
</script>

<div class="flex flex-col gap-8">
	<div>
		<h1 class="text-2xl font-bold text-stone-900">Paramètres du foyer</h1>
		<a href="/board" class="text-sm text-stone-500 underline">&larr; Retour au tableau</a>
	</div>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">Nom du foyer</h2>
		{#if form?.action === 'rename' && form?.message}
			<p class="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<form method="post" action="?/rename" use:enhance class="mt-3 flex gap-2">
			<input
				name="name"
				value={data.household.name}
				disabled={!data.isOwner}
				class="flex-1 rounded-lg border border-stone-300 px-3 py-2 disabled:bg-stone-100 disabled:text-stone-500"
			/>
			{#if data.isOwner}
				<button type="submit" class="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700">
					Renommer
				</button>
			{/if}
		</form>
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<h2 class="font-semibold text-stone-900">Membres</h2>
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.members as member (member.membershipId)}
				<li class="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-2">
					<span class="text-stone-800">
						{member.user.name || member.user.email}
						{#if member.user.id === data.household.owner}<span class="ml-1 text-xs text-stone-400">(propriétaire)</span>{/if}
					</span>
					{#if member.user.id !== data.household.owner && (data.isOwner || member.user.id === page.data.user?.id)}
						<form method="post" action="?/removeMember" use:enhance>
							<input type="hidden" name="membershipId" value={member.membershipId} />
							<button type="submit" class="text-sm text-red-600 hover:underline">
								{member.user.id === page.data.user?.id ? 'Quitter' : 'Retirer'}
							</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		{#if form?.action === 'removeMember' && form?.message}
			<p class="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-6">
		<div class="flex items-center justify-between">
			<h2 class="font-semibold text-stone-900">Invitations</h2>
			<form method="post" action="?/createInvite" use:enhance>
				<button type="submit" class="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium hover:bg-stone-100">
					+ Nouveau lien
				</button>
			</form>
		</div>
		{#if form?.action === 'createInvite' && form?.message}
			<p class="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.invites as invite (invite.id)}
				<li class="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-4 py-2 text-sm">
					<code class="truncate text-stone-600">{inviteUrl(invite.code)}</code>
					<div class="flex shrink-0 items-center gap-3">
						<span class="text-xs text-stone-400">{invite.uses_count} utilisation{invite.uses_count > 1 ? 's' : ''}</span>
						<button type="button" onclick={() => copyInvite(invite.code)} class="text-stone-600 hover:underline">
							Copier
						</button>
						<form method="post" action="?/revokeInvite" use:enhance>
							<input type="hidden" name="inviteId" value={invite.id} />
							<button type="submit" class="text-red-600 hover:underline">Révoquer</button>
						</form>
					</div>
				</li>
			{:else}
				<p class="text-sm text-stone-500">Aucune invitation active.</p>
			{/each}
		</ul>
	</section>
</div>
