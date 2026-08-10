<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
	<h1 class="text-4xl font-bold tracking-tight text-stone-900">{m.landing_title()}</h1>
	<p class="text-lg text-stone-600">
		{m.landing_pitch()}
	</p>
	<div class="flex gap-4">
		<a
			href="/signup"
			class="rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition hover:bg-stone-700"
		>
			{m.landing_signup()}
		</a>
		<a
			href="/login"
			class="rounded-full border border-stone-300 px-6 py-3 font-medium text-stone-900 transition hover:bg-stone-100"
		>
			{m.landing_login()}
		</a>
	</div>
</main>
