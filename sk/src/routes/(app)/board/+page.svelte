<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
	<h1 class="text-xl font-semibold text-stone-900">Tableau des tâches</h1>
	<p class="mt-2 text-stone-500">
		Bienvenue dans « {page.data.activeHousehold?.name} ». Le tableau des tâches arrive bientôt.
	</p>
</div>
