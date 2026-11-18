<script lang="ts">
	import 'layerchart/core.css';
	import { BarChart, LineChart } from 'layerchart';
	import { Activity, ChartColumn, Crown, Flame, HeartPulse, Shapes, Swords, Users } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import WindowToggle from '$lib/WindowToggle.svelte';
	import { avatarHue, formatPoints } from '$lib/game';
	import { CATEGORY_ICONS, CATEGORY_LABELS } from '$lib/kindUi';
	import { CATEGORY_COLORS } from '$lib/questCategories';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Coin from '$lib/ui/Coin.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const scoreData = $derived(data.ranking.map((r) => ({ name: r.name, total: r.total })));
	const trendData = $derived(data.trend.map((t) => ({ date: new Date(t.date), count: t.count })));

	const healthData = $derived([
		{ key: 'ok', label: m.dashboard_health_ok(), count: data.health.ok },
		{ key: 'dueSoon', label: m.dashboard_health_due_soon(), count: data.health.dueSoon },
		{ key: 'overdue', label: m.dashboard_health_overdue(), count: data.health.overdue }
	]);
	// same greens/ambers/reds as the quest status chips on the board
	const healthColors = ['#22c55e', '#f59e0b', '#f43f5e'];
	const totalTasks = $derived(data.health.ok + data.health.dueSoon + data.health.overdue);

	const totalPoints = $derived(formatPoints(data.ranking.reduce((sum, r) => sum + r.total, 0)));
	const questsDone = $derived(data.trend.reduce((sum, t) => sum + t.count, 0));

	// comparing who does what only makes sense with more than one player
	const compare = $derived(data.categories.members.length > 1);
	const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
</script>

<div class="flex flex-col gap-4">
	<PageHeader title={m.dashboard_title()} eyebrow={data.activeHousehold?.name} icon={ChartColumn} />

	<WindowToggle current={data.window} />

	<div class="grid grid-cols-3 gap-2.5">
		<div class="stat panel">
			<Coin class="size-9" />
			<span class="stat-value text-outline font-display">{totalPoints}</span>
			<span class="stat-label">{m.dashboard_stat_points()}</span>
		</div>
		<div class="stat panel">
			<span class="stat-icon bg-gradient-to-b from-sky-400 to-blue-600"><Swords class="size-4.5" strokeWidth={3} /></span>
			<span class="stat-value text-outline font-display">{questsDone}</span>
			<span class="stat-label">{m.dashboard_stat_quests()}</span>
		</div>
		<div class="stat panel">
			<span class="stat-icon bg-gradient-to-b from-rose-400 to-rose-600"><Flame class="size-4.5" strokeWidth={3} /></span>
			<span class="stat-value text-outline font-display">{data.health.overdue}</span>
			<span class="stat-label">{m.dashboard_health_overdue()}</span>
		</div>
	</div>

	<section class="panel p-4">
		<h2 class="panel-heading mb-3"><Users class="size-5" strokeWidth={3} />{m.dashboard_scores_heading()}</h2>
		{#if scoreData.length === 0}
			<p class="py-8 text-center font-bold text-night-300">{m.dashboard_empty()}</p>
		{:else}
			<div class="h-56">
				<BarChart data={scoreData} x="name" y="total" series={[{ key: 'total', color: '#ffcd38' }]} height={224} />
			</div>
		{/if}
	</section>

	<section class="panel p-4">
		<h2 class="panel-heading mb-3"><Activity class="size-5" strokeWidth={3} />{m.dashboard_trend_heading()}</h2>
		{#if trendData.length === 0}
			<p class="py-8 text-center font-bold text-night-300">{m.dashboard_empty()}</p>
		{:else}
			<div class="h-56">
				<LineChart
					data={trendData}
					x="date"
					y="count"
					series={[{ key: 'count', color: '#38bdf8', label: m.dashboard_trend_completions() }]}
					height={224}
				/>
			</div>
		{/if}
	</section>

	<section class="panel p-4">
		<h2 class="panel-heading"><Shapes class="size-5" strokeWidth={3} />{m.dashboard_categories_heading()}</h2>
		<p class="mt-1 mb-3 text-sm font-bold text-night-200">{m.dashboard_categories_hint()}</p>
		{#if data.categories.members.length === 0}
			<p class="py-8 text-center font-bold text-night-300">{m.dashboard_empty()}</p>
		{:else}
			<ul class="flex flex-col gap-2.5">
				{#each data.categories.members as member (member.id)}
					{@const top = member.categories[0]}
					{@const TopIcon = CATEGORY_ICONS[top.category]}
					<li class="panel-inset flex flex-col gap-2.5 p-3">
						<div class="flex items-center gap-3">
							<Avatar name={member.name} seed={member.id} class="size-10 text-base" />
							<span class="min-w-0 flex-1">
								<span class="block truncate font-display text-lg leading-tight text-white">{member.name}</span>
								<span class="text-xs font-extrabold text-night-300">{m.dashboard_categories_quests({ count: member.total })}</span>
							</span>
						</div>

						<div class="mix" role="img" aria-label={member.categories.map((c) => `${CATEGORY_LABELS[c.category]()} ${pct(c.count, member.total)}%`).join(', ')}>
							{#each member.categories as c (c.category)}
								<span
									style="--c: {CATEGORY_COLORS[c.category]}; flex-grow: {c.count}"
									title="{CATEGORY_LABELS[c.category]()} · {c.count} ({pct(c.count, member.total)}%)"
								></span>
							{/each}
						</div>

						<div class="flex flex-col gap-1.5 text-sm">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="row-label">{m.dashboard_categories_top()}</span>
								<span class="cat-chip" style="--c: {CATEGORY_COLORS[top.category]}">
									<span class="cat-icon" aria-hidden="true"><TopIcon class="size-3" strokeWidth={3} /></span>
									{CATEGORY_LABELS[top.category]()}
									<span class="opacity-70">{pct(top.count, member.total)}%</span>
								</span>
							</div>
							{#if compare}
								<div class="flex flex-wrap items-center gap-1.5">
									<span class="row-label"><Crown class="size-3.5" strokeWidth={3} />{m.dashboard_categories_leads()}</span>
									{#each member.leads as lead (lead.category)}
										{@const LeadIcon = CATEGORY_ICONS[lead.category]}
										<span
											class="cat-chip"
											style="--c: {CATEGORY_COLORS[lead.category]}"
											title={m.dashboard_categories_lead_title({ count: lead.count, total: lead.total })}
										>
											<span class="cat-icon" aria-hidden="true"><LeadIcon class="size-3" strokeWidth={3} /></span>
											{CATEGORY_LABELS[lead.category]()}
											<span class="opacity-70">{Math.round(lead.share * 100)}%</span>
										</span>
									{:else}
										<span class="text-xs font-bold text-night-300">{m.dashboard_categories_no_lead()}</span>
									{/each}
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			{#if compare}
				<h3 class="mt-4 mb-2 font-display text-white">{m.dashboard_categories_by_type()}</h3>
				<ul class="flex flex-col gap-2.5">
					{#each data.categories.categories as cat (cat.category)}
						{@const Icon = CATEGORY_ICONS[cat.category]}
						{@const leader = cat.members.find((x) => x.id === cat.leader)}
						<li class="flex flex-col gap-1">
							<div class="flex items-center gap-2 text-sm">
								<span class="cat-icon cat-icon-lg" style="--c: {CATEGORY_COLORS[cat.category]}" aria-hidden="true">
									<Icon class="size-3.5" strokeWidth={3} />
								</span>
								<span class="min-w-0 flex-1 truncate font-extrabold text-white">{CATEGORY_LABELS[cat.category]()}</span>
								<span class="shrink-0 text-xs font-extrabold text-night-200">
									{#if leader}
										<Crown class="inline size-3.5 text-gold-300" strokeWidth={3} />
										{m.dashboard_categories_leader({ name: leader.name, percent: pct(leader.count, cat.total) })}
									{:else}
										{m.dashboard_categories_tie()}
									{/if}
									· {cat.total}
								</span>
							</div>
							<div
								class="mix"
								role="img"
								aria-label={cat.members.map((x) => `${x.name} ${pct(x.count, cat.total)}%`).join(', ')}
							>
								{#each cat.members as x (x.id)}
									<span
										style="--c: hsl({avatarHue(x.id)} 70% 55%); flex-grow: {x.count}"
										title="{x.name} · {x.count} ({pct(x.count, cat.total)}%)"
									></span>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
				<div class="mt-3 flex flex-wrap gap-x-3 gap-y-1" aria-hidden="true">
					{#each data.categories.members as member (member.id)}
						<span class="flex items-center gap-1.5 text-xs font-extrabold text-night-200">
							<span class="swatch" style="--c: hsl({avatarHue(member.id)} 70% 55%)"></span>{member.name}
						</span>
					{/each}
				</div>
			{/if}
		{/if}
	</section>

	<section class="panel p-4">
		<h2 class="panel-heading mb-3"><HeartPulse class="size-5" strokeWidth={3} />{m.dashboard_task_health_heading()}</h2>
		{#if totalTasks === 0}
			<p class="py-8 text-center font-bold text-night-300">{m.dashboard_empty()}</p>
		{:else}
			<div class="h-56">
				<BarChart
					data={healthData}
					x="label"
					y="count"
					c="key"
					cDomain={['ok', 'dueSoon', 'overdue']}
					cRange={healthColors}
					height={224}
				/>
			</div>
		{/if}
	</section>
</div>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 0.8rem 0.4rem 0.7rem;
		text-align: center;
	}
	.stat-icon {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.75rem;
		border: 3px solid var(--color-night-950);
		color: white;
		box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.4);
	}
	.stat-value {
		font-size: 1.6rem;
		line-height: 1;
		color: white;
		font-variant-numeric: tabular-nums;
	}
	/* a stacked bar: one segment per category / member, sized by count */
	.mix {
		display: flex;
		gap: 2px;
		height: 0.85rem;
		overflow: hidden;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: var(--color-night-950);
	}
	.mix > span {
		flex-basis: 0;
		min-width: 4px;
		background: linear-gradient(180deg, color-mix(in srgb, var(--c) 75%, white), var(--c));
	}
	.row-label {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-right: 0.15rem;
		font-size: 0.66rem;
		font-weight: 900;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-night-300);
	}
	.cat-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 1.75rem;
		padding: 0.1rem 0.6rem 0.1rem 0.2rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: color-mix(in srgb, var(--c) 30%, transparent);
		color: white;
		font-size: 0.75rem;
		font-weight: 900;
	}
	.cat-icon {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: var(--c);
		color: white;
	}
	.cat-icon-lg {
		width: 1.6rem;
		height: 1.6rem;
	}
	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 999px;
		border: 2px solid var(--color-night-950);
		background: var(--c);
	}
	.stat-label {
		font-size: 0.66rem;
		font-weight: 900;
		line-height: 1.15;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-night-200);
	}
</style>
