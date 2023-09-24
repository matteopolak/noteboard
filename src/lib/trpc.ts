import type { Router } from '../../server/src/router';
import { browser } from '$app/environment';

import ws from 'ws';
import { createTRPCProxyClient, createWSClient, httpLink, splitLink, wsLink } from '@trpc/client';

let browserClient: ReturnType<typeof createTRPCProxyClient<Router>>;

export function trpc() {
	if (browser && browserClient) return browserClient;

	const client = createTRPCProxyClient<Router>({
		links: [
			splitLink({
				condition: o => o.type === 'subscription' || o.path === 'getChunk' || o.path === 'updateColor',
				true: wsLink({
					client: createWSClient({
						url: 'ws://localhost:4039',
						// @ts-ignore
						WebSocket: browser ? WebSocket : ws.WebSocket,
					}),
				}),
				false: httpLink({
					url: 'http://localhost:4038',
				}),
			}),
		],
	});

	if (browser) browserClient = client;

	return client;
}
