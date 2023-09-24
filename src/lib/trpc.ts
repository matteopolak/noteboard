import type { Router } from '../../server/src/router';
import { browser } from '$app/environment';

import ws from 'ws';
import {
  createTRPCProxyClient,
  createWSClient,
  httpLink,
  splitLink,
  wsLink,
} from '@trpc/client';

let browserClient: ReturnType<typeof createTRPCProxyClient<Router>>;

export function trpc() {
  if (browser && browserClient) return browserClient;

  const client = createTRPCProxyClient<Router>({
    links: [
      splitLink({
        condition: (o) =>
          o.type === 'subscription' ||
          o.path === 'updateCell' ||
          o.path === 'removeCell' ||
					o.path === 'requestChunkStream',
        true: wsLink({
          client: createWSClient({
            url: 'ws://192.168.2.120:4039',
            // @ts-ignore
            WebSocket: browser ? WebSocket : ws.WebSocket,
          }),
        }),
        false: httpLink({
          url: 'http://192.168.2.120:4038',
        }),
      }),
    ],
  });

  if (browser) browserClient = client;

  return client;
}
