<script lang="ts">
	import { browser } from '$app/environment';
	import { trpc } from '$lib/trpc/client';

	if (browser) {
		// Create a new websocket
		const ws = new WebSocket('ws://localhost:5173');

		ws.addEventListener('message', (message: any) => {
			const data: Request = JSON.parse(message.data);

			console.log(data);
		});
	}
</script>
