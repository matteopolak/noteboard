import type { Router } from '$lib/trpc/router';
import { browser } from '$app/environment';

import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit';

let browserClient: ReturnType<typeof createTRPCClient<Router>>;

export function trpc(init?: TRPCClientInit) {
	if (browser && browserClient) return browserClient;

	const client = createTRPCClient<Router>({ init });
	if (browser) browserClient = client;

	return client;
}
