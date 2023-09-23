<script lang="ts">
	import { browser } from '$app/environment';
	import { trpc } from '$lib/trpc';

	trpc().live.subscribe(undefined, {
		onData(value) {
			console.log(value);
		},
	});
</script>
