<script lang="ts">
	import Grid from '$lib/components/Grid.svelte';
	import { onMount } from 'svelte';

	let innerWidth: number;
	let innerHeight: number;

	onMount(() => {
		document.addEventListener('contextmenu', e => e.preventDefault());
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<Grid width={innerWidth} height={innerHeight} />
