<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let zoom = 1;

	function changeZoom(value: number) {
		if (zoom === value) return;

		zoom = value;
		dispatch('zoom', zoom);
	}
</script>

<div class="flex flex-row gap-2">
	<button
		class="rounded-full w-8 h-8 bg-slate-600/80 hover:bg-slate-600/60 active:bg-slate-600/100 text-white font-extrabold font-mono text-2xl"
		on:click={() => changeZoom(Math.min(2, zoom + 0.1))}
	>
		+
	</button>
	<button
		class="rounded-full w-8 h-8 bg-slate-600/80 hover:bg-slate-600/60 active:bg-slate-600/100 text-white font-extrabold font-mono text-2xl"
		on:click={() => changeZoom(Math.max(0.1, zoom - 0.1))}
	>
		-
	</button>
</div>
