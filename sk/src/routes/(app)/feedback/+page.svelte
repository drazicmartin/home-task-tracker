<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Bug, Check, ChevronLeft, ClipboardCopy, Inbox, Lightbulb, MessageSquare, RotateCcw, Send, Trash, TriangleAlert } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Item = PageData['mine'][number];

	let inboxTab = $state<'open' | 'done'>('open');
	let sending = $state(false);
	let messageText = $state('');

	const kindLabels: Record<Item['kind'], () => string> = {
		bug: m.feedback_kind_bug,
		idea: m.feedback_kind_idea,
		other: m.feedback_kind_other
	};
	const kindIcons = { bug: Bug, idea: Lightbulb, other: MessageSquare };

	const inboxShown = $derived(data.inbox.filter((i) => i.status === inboxTab));
	const openCount = $derived(data.inbox.filter((i) => i.status === 'open').length);

	const dateFormat = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
	const formatDate = (iso: string) => dateFormat.format(new Date(iso));

	/** One message as a Markdown block, ready to paste into Claude Code. */
	function itemToMarkdown(item: Item, index?: number): string {
		const meta = [
			item.created.slice(0, 10),
			item.author && `de ${item.author}`,
			item.household && `foyer « ${item.household} »`,
			item.page && `page \`${item.page}\``
		]
			.filter(Boolean)
			.join(' — ');
		const title = `${index !== undefined ? `${index + 1}. ` : ''}[${kindLabels[item.kind]()}] ${meta}`;
		const body = item.message
			.split('\n')
			.map((line) => `> ${line}`)
			.join('\n');
		return `### ${title}\n${body}`;
	}

	function buildPrompt(items: Item[]): string {
		return [
			`Voici ${items.length} retour(s) d'utilisateurs de l'application Home Task Tracker (SvelteKit + PocketBase, ce dépôt).`,
			"Analyse-les, corrige les bugs signalés et implémente les idées pertinentes. Si un retour n'est pas clair ou pas pertinent, explique pourquoi au lieu de l'implémenter.",
			'',
			...items.map((item, i) => itemToMarkdown(item, i) + '\n')
		].join('\n');
	}

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(m.feedback_copied());
		} catch {
			toast.error(m.generic_error());
		}
	}

	const sendSubmit: SubmitFunction = () => {
		sending = true;
		return async ({ result, update }) => {
			sending = false;
			if (result.type === 'success') {
				toast.success(m.feedback_sent());
				messageText = '';
			}
			await update();
		};
	};
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-4">
	<a href={data.from || '/board'} class="btn btn-sm self-start">
		<ChevronLeft class="size-4" strokeWidth={3.5} />{m.feedback_back()}
	</a>
	<PageHeader title={m.feedback_title()} icon={MessageSquare} />

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><Send class="size-5" strokeWidth={3} />{m.feedback_write_heading()}</h2>
		<p class="mt-1.5 text-sm font-bold text-night-200">{m.feedback_write_hint()}</p>

		<form method="post" action="?/send" use:enhance={sendSubmit} class="mt-3 flex flex-col gap-3">
			{#if form?.action === 'send' && 'message' in form && form.message}
				<p class="alert-error" role="alert"><TriangleAlert class="size-4 shrink-0" strokeWidth={3} />{form.message}</p>
			{/if}
			<input type="hidden" name="page" value={data.from} />

			<fieldset class="grid grid-cols-3 gap-2">
				<legend class="field-label mb-1.5">{m.feedback_kind()}</legend>
				{#each ['bug', 'idea', 'other'] as const as kind (kind)}
					{@const Icon = kindIcons[kind]}
					<label
						class="panel-inset flex cursor-pointer flex-col items-center gap-1 p-2.5 text-center font-display text-white has-checked:border-gold-400 has-checked:bg-gold-500/15"
					>
						<input
							type="radio"
							name="kind"
							value={kind}
							checked={(form && 'kind' in form ? form.kind : 'idea') === kind}
							class="sr-only"
						/>
						<Icon class="size-5" strokeWidth={2.75} />
						{kindLabels[kind]()}
					</label>
				{/each}
			</fieldset>

			<label class="field">
				<span class="field-label">{m.feedback_message()}</span>
				<textarea
					name="message"
					rows="5"
					maxlength="5000"
					required
					bind:value={messageText}
					placeholder={m.feedback_message_placeholder()}
					class="input"
				></textarea>
			</label>

			<button type="submit" disabled={sending} class="btn btn-gold btn-block shine">
				<Send class="size-5" strokeWidth={3} />{m.feedback_send()}
			</button>
		</form>
	</section>

	<section class="panel p-4 sm:p-5">
		<h2 class="panel-heading"><MessageSquare class="size-5" strokeWidth={3} />{m.feedback_mine_heading()}</h2>
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.mine as item (item.id)}
				{@const Icon = kindIcons[item.kind]}
				<li class="panel-inset flex flex-col gap-2 p-3">
					<div class="flex flex-wrap items-center gap-2 text-xs font-extrabold text-night-300">
						<span class="chip"><Icon class="size-3.5" strokeWidth={3} />{kindLabels[item.kind]()}</span>
						{#if item.status === 'done'}
							<span class="chip chip-ok"><Check class="size-3.5" strokeWidth={3.5} />{m.feedback_status_done()}</span>
						{/if}
						<span>{formatDate(item.created)}</span>
					</div>
					<p class="font-semibold whitespace-pre-wrap text-night-50">{item.message}</p>
					<form
						method="post"
						action="?/deleteMine"
						use:enhance={({ cancel }) => {
							if (!confirm(m.feedback_delete_confirm())) cancel();
						}}
						class="self-end"
					>
						<input type="hidden" name="id" value={item.id} />
						<button type="submit" class="btn btn-sm btn-red"><Trash class="size-4" strokeWidth={3} />{m.feedback_delete()}</button>
					</form>
				</li>
			{:else}
				<p class="font-bold text-night-300">{m.feedback_mine_empty()}</p>
			{/each}
		</ul>
	</section>

	{#if data.developer}
		<!-- Developer inbox: every user's messages, copyable as a Claude Code prompt -->
		<section class="panel p-4 sm:p-5">
			<h2 class="panel-heading"><Inbox class="size-5" strokeWidth={3} />{m.feedback_inbox_heading()}</h2>
			<p class="mt-1.5 text-sm font-bold text-night-200">{m.feedback_inbox_hint()}</p>

			<div class="mt-3 grid grid-cols-2 gap-2">
				<button
					type="button"
					class="btn btn-sm {inboxTab === 'open' ? 'btn-gold' : ''}"
					aria-pressed={inboxTab === 'open'}
					onclick={() => (inboxTab = 'open')}
				>
					{m.feedback_tab_open({ count: openCount })}
				</button>
				<button
					type="button"
					class="btn btn-sm {inboxTab === 'done' ? 'btn-gold' : ''}"
					aria-pressed={inboxTab === 'done'}
					onclick={() => (inboxTab = 'done')}
				>
					{m.feedback_tab_done({ count: data.inbox.length - openCount })}
				</button>
			</div>

			{#if inboxShown.length > 0}
				<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
					<button type="button" class="btn btn-blue btn-sm" onclick={() => copy(buildPrompt(inboxShown))}>
						<ClipboardCopy class="size-4" strokeWidth={3} />{m.feedback_copy_all({ count: inboxShown.length })}
					</button>
					{#if inboxTab === 'open'}
						<form method="post" action="?/markAllDone" use:enhance class="contents">
							{#each inboxShown as item (item.id)}
								<input type="hidden" name="id" value={item.id} />
							{/each}
							<button type="submit" class="btn btn-green btn-sm">
								<Check class="size-4" strokeWidth={3.5} />{m.feedback_mark_all_done()}
							</button>
						</form>
					{/if}
				</div>
			{/if}

			<ul class="mt-3 flex flex-col gap-2">
				{#each inboxShown as item (item.id)}
					{@const Icon = kindIcons[item.kind]}
					<li class="panel-inset flex flex-col gap-2 p-3">
						<div class="flex flex-wrap items-center gap-2 text-xs font-extrabold text-night-300">
							<span class="chip"><Icon class="size-3.5" strokeWidth={3} />{kindLabels[item.kind]()}</span>
							<span class="text-night-100">{item.author}</span>
							{#if item.household}<span>· {item.household}</span>{/if}
							{#if item.page}<code class="rounded bg-night-950/60 px-1.5 py-0.5">{item.page}</code>{/if}
							<span>· {formatDate(item.created)}</span>
						</div>
						<p class="font-semibold whitespace-pre-wrap text-night-50">{item.message}</p>
						<div class="flex flex-wrap justify-end gap-2">
							<button type="button" class="btn btn-sm btn-blue" onclick={() => copy(itemToMarkdown(item))}>
								<ClipboardCopy class="size-4" strokeWidth={3} />{m.feedback_copy()}
							</button>
							<form method="post" action="?/setStatus" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<input type="hidden" name="status" value={item.status === 'open' ? 'done' : 'open'} />
								<button type="submit" class="btn btn-sm {item.status === 'open' ? 'btn-green' : ''}">
									{#if item.status === 'open'}
										<Check class="size-4" strokeWidth={3.5} />{m.feedback_mark_done()}
									{:else}
										<RotateCcw class="size-4" strokeWidth={3} />{m.feedback_reopen()}
									{/if}
								</button>
							</form>
							<form
								method="post"
								action="?/deleteAny"
								use:enhance={({ cancel }) => {
									if (!confirm(m.feedback_delete_confirm())) cancel();
								}}
							>
								<input type="hidden" name="id" value={item.id} />
								<button type="submit" class="btn btn-sm btn-red" aria-label={m.feedback_delete()}>
									<Trash class="size-4" strokeWidth={3} />
								</button>
							</form>
						</div>
					</li>
				{:else}
					<p class="font-bold text-night-300">{m.feedback_inbox_empty()}</p>
				{/each}
			</ul>
		</section>
	{/if}
</div>
