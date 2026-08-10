<script lang="ts">
	import 'layerchart/core.css';
	import { BarChart, LineChart } from 'layerchart';
	import * as m from '$lib/paraglide/messages.js';
	import WindowToggle from '$lib/WindowToggle.svelte';
	import { urgencyHue } from '$lib/scoring';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const scoreData = $derived(data.ranking.map((r) => ({ name: r.name, total: r.total })));
	const trendData = $derived(data.trend.map((t) => ({ date: new Date(t.date), count: t.count })));

	const healthData = $derived([
		{ key: 'ok', label: m.dashboard_health_ok(), count: data.health.ok },
		{ key: 'dueSoon', label: m.dashboard_health_due_soon(), count: data.health.dueSoon },
		{ key: 'overdue', label: m.dashboard_health_overdue(), count: data.health.overdue }
	]);
	const healthColors = [
		`hsl(${urgencyHue(0)} 62% 45%)`,
		`hsl(${urgencyHue(85)} 62% 45%)`,
		`hsl(${urgencyHue(100)} 62% 45%)`
	];
	const totalTasks = $derived(data.health.ok + data.health.dueSoon + data.health.overdue);
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold text-stone-900">{m.dashboard_title()}</h1>
		<WindowToggle current={data.window} />
	</div>

	<section class="rounded-2xl border border-stone-200 bg-white p-4">
		<h2 class="mb-4 text-sm font-semibold text-stone-600 uppercase">{m.dashboard_scores_heading()}</h2>
		{#if scoreData.length === 0}
			<p class="py-8 text-center text-stone-500">{m.dashboard_empty()}</p>
		{:else}
			<div class="h-64">
				<BarChart data={scoreData} x="name" y="total" series={[{ key: 'total', color: '#059669' }]} height={256} />
			</div>
		{/if}
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-4">
		<h2 class="mb-4 text-sm font-semibold text-stone-600 uppercase">{m.dashboard_trend_heading()}</h2>
		{#if trendData.length === 0}
			<p class="py-8 text-center text-stone-500">{m.dashboard_empty()}</p>
		{:else}
			<div class="h-64">
				<LineChart
					data={trendData}
					x="date"
					y="count"
					series={[{ key: 'count', color: '#0ea5e9', label: m.dashboard_trend_completions() }]}
					height={256}
				/>
			</div>
		{/if}
	</section>

	<section class="rounded-2xl border border-stone-200 bg-white p-4">
		<h2 class="mb-4 text-sm font-semibold text-stone-600 uppercase">{m.dashboard_task_health_heading()}</h2>
		{#if totalTasks === 0}
			<p class="py-8 text-center text-stone-500">{m.dashboard_empty()}</p>
		{:else}
			<div class="h-64">
				<BarChart
					data={healthData}
					x="label"
					y="count"
					c="key"
					cDomain={['ok', 'dueSoon', 'overdue']}
					cRange={healthColors}
					height={256}
				/>
			</div>
		{/if}
	</section>
</div>
