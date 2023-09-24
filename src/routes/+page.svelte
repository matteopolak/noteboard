<script lang="ts">
	import Grid from '$lib/components/Grid.svelte';

	let innerWidth: number;
	let innerHeight: number;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<Grid width={innerWidth} height={innerHeight} />
