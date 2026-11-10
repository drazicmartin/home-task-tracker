<script lang="ts">
	import 'layerchart/core.css';
	import { BarChart, LineChart } from 'layerchart';
	import { Activity, ChartColumn, Flame, HeartPulse, Swords, Users } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
	import WindowToggle from '$lib/WindowToggle.svelte';
	import { formatPoints } from '$lib/game';
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
	.stat-label {
		font-size: 0.66rem;
		font-weight: 900;
		line-height: 1.15;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-night-200);
	}
</style>
