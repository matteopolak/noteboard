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
            url: 'wss://noteboardws.matteopolak.com',
            // @ts-ignore
            WebSocket: browser ? WebSocket : ws.WebSocket,
          }),
        }),
        false: httpLink({
          url: 'https://noteboardapi.matteopolak.com',
        }),
      }),
    ],
  });

  if (browser) browserClient = client;

  return client;
}
