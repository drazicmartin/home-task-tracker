<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { ChevronLeft, Copy, Crown, DoorOpen, Link, Plus, Settings, Skull, Trash, TriangleAlert, Users, X } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import Avatar from '$lib/ui/Avatar.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function inviteUrl(code: string): string {
		return `${page.url.origin}/invite/${code}`;
	}

	async function copyInvite(code: string) {
		await navigator.clipboard.writeText(inviteUrl(code));
		toast.success(m.settings_copied());
	}

	let confirmName = $state('');

	// who inherits the household if the owner leaves (oldest other member)
	const successor = $derived(data.members.find((member) => member.user.id !== data.household.owner)?.user);
	const canLeave = $derived(!data.isOwner || Boolean(successor));
</script>

<div class="mx-auto flex max-w-xl flex-col gap-4">
	<a href="/board" class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{m.back_to_board()}
	</a>
	<PageHeader title={m.settings_title()} eyebrow={data.household.name} icon={Settings} />

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading">{m.settings_household_name()}</h2>
		{#if form?.action === 'rename' && form?.message}
			<p class="alert-error mt-3" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
		{/if}
		<form method="post" action="?/rename" use:enhance class="mt-3 flex gap-2">
			<input
				name="name"
				value={data.household.name}
				disabled={!data.isOwner}
				aria-label={m.settings_household_name()}
				class="input min-w-0 flex-1"
			/>
			{#if data.isOwner}
				<button type="submit" class="btn btn-gold">{m.settings_rename()}</button>
			{/if}
		</form>
	</section>

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><Users class="size-5" strokeWidth={3} />{m.settings_members()}</h2>
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.members as member (member.membershipId)}
				{@const isOwner = member.user.id === data.household.owner}
				<li class="panel-inset flex items-center gap-3 py-2 pr-2 pl-2.5">
					<Avatar name={member.user.name || member.user.email} seed={member.user.id} class="size-10 text-base" />
					<span class="min-w-0 flex-1">
						<span class="block truncate font-display text-lg leading-tight text-white">
							{member.user.name || member.user.email}
						</span>
						{#if isOwner}
							<span class="chip chip-gold mt-0.5">
								<Crown class="size-3" strokeWidth={3} fill="currentColor" />{m.settings_owner_tag()}
							</span>
						{/if}
					</span>
					{#if !isOwner && data.isOwner}
						<form
							method="post"
							action="?/removeMember"
							use:enhance={({ cancel }) => {
								if (!confirm(m.settings_remove_confirm({ name: member.user.name || member.user.email }))) cancel();
							}}
						>
							<input type="hidden" name="membershipId" value={member.membershipId} />
							<button type="submit" class="btn btn-sm btn-red">{m.settings_remove()}</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		{#if form?.action === 'removeMember' && form?.message}
			<p class="alert-error mt-3" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
		{/if}
	</section>

	<section class="panel p-4 sm:p-5">
		<div class="flex items-center justify-between gap-3">
			<h2 class="panel-heading"><Link class="size-5" strokeWidth={3} />{m.settings_invitations()}</h2>
			<form method="post" action="?/createInvite" use:enhance>
				<button type="submit" class="btn btn-sm btn-green">
					<Plus class="size-4" strokeWidth={3.5} />{m.settings_new_link()}
				</button>
			</form>
		</div>
		{#if form?.action === 'createInvite' && form?.message}
			<p class="alert-error mt-3" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
		{/if}
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.invites as invite (invite.id)}
				<li class="panel-inset flex flex-col gap-2 p-2.5">
					<code class="truncate rounded-lg bg-night-950/60 px-2.5 py-1.5 text-sm font-bold text-night-100">
						{inviteUrl(invite.code)}
					</code>
					<span class="px-1 text-xs font-extrabold text-night-300">{m.settings_uses({ count: invite.uses_count })}</span>
					<div class="grid grid-cols-2 gap-2">
						<button type="button" onclick={() => copyInvite(invite.code)} class="btn btn-sm btn-blue">
							<Copy class="size-4" strokeWidth={3} />{m.settings_copy()}
						</button>
						<form method="post" action="?/revokeInvite" use:enhance class="contents">
							<input type="hidden" name="inviteId" value={invite.id} />
							<button type="submit" class="btn btn-sm btn-red">
								<X class="size-4" strokeWidth={3.5} />{m.settings_revoke()}
							</button>
						</form>
					</div>
				</li>
			{:else}
				<p class="font-bold text-night-300">{m.settings_no_invites()}</p>
			{/each}
		</ul>
	</section>

	<!-- Danger zone: leave / delete the household -->
	<section class="panel border-rose-500/70 p-4 sm:p-5">
		<h2 class="panel-heading text-rose-300"><Skull class="size-5" strokeWidth={3} />{m.settings_danger_heading()}</h2>

		{#if (form?.action === 'leave' || form?.action === 'deleteHousehold') && form?.message}
			<p class="alert-error mt-3" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
		{/if}

		<div class="panel-inset mt-3 flex flex-col gap-2 p-3">
			<p class="font-display text-lg text-white">{m.settings_leave_heading()}</p>
			<p class="text-sm font-bold text-night-200">
				{#if !data.isOwner}
					{m.settings_leave_hint()}
				{:else if successor}
					{m.settings_leave_owner_hint({ name: successor.name || successor.email })}
				{:else}
					{m.settings_leave_alone_hint()}
				{/if}
			</p>
			<form
				method="post"
				action="?/leave"
				use:enhance={({ cancel }) => {
					if (!confirm(m.settings_leave_confirm({ household: data.household.name }))) cancel();
				}}
			>
				<button type="submit" class="btn btn-sm btn-red btn-block" disabled={!canLeave}>
					<DoorOpen class="size-4" strokeWidth={3} />{m.settings_leave_button()}
				</button>
			</form>
		</div>

		{#if data.isOwner}
			<form
				method="post"
				action="?/deleteHousehold"
				use:enhance={({ cancel }) => {
					if (!confirm(m.settings_delete_confirm({ household: data.household.name }))) cancel();
				}}
				class="panel-inset mt-3 flex flex-col gap-2 border-dashed border-rose-500/60 p-3"
			>
				<p class="font-display text-lg text-white">{m.settings_delete_heading()}</p>
				<p class="text-sm font-bold text-night-200">{m.settings_delete_hint()}</p>
				<label class="field">
					<span class="field-label">{m.settings_delete_type_name({ household: data.household.name })}</span>
					<input name="confirmName" bind:value={confirmName} autocomplete="off" class="input" />
				</label>
				<button
					type="submit"
					class="btn btn-sm btn-red btn-block"
					disabled={confirmName.trim() !== data.household.name.trim()}
				>
					<Trash class="size-4" strokeWidth={3} />{m.settings_delete_button()}
				</button>
			</form>
		{/if}
	</section>
</div>
