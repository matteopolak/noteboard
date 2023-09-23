import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';
import { Pool } from 'pg';

import { DATABASE_URL } from '$env/static/private'; 

export const pool = new Pool({
	connectionString: DATABASE_URL,
});

export async function createContext(_: RequestEvent) {
	return {
		pool,
	};
}

export type Context = inferAsyncReturnType<typeof createContext>;
