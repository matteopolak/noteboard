import type { Router } from '../../../server/src/router';
import { browser } from '$app/environment';

import { createTRPCProxyClient, createWSClient, httpLink, splitLink, wsLink } from '@trpc/client';

let browserClient: ReturnType<typeof createTRPCProxyClient<Router>>;

export function trpc() {
	if (browser && browserClient) return browserClient;

	const client = createTRPCProxyClient<Router>({
		links: [
			splitLink({
				condition: o => o.type === 'subscription',
				true: wsLink({
					client: createWSClient({
						url: 'http://localhost:4038',
						WebSocket: browser ? WebSocket : require('ws'),
					}),
				}),
				false: httpLink({
					url: 'ws://localhost:4039',
				}),
			}),
		],
	});

	if (browser) browserClient = client;

	return client;
}
