import type { inferAsyncReturnType } from '@trpc/server';
import pg from 'pg';

export const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
});

export async function createContext(_: any) {
	return {
		pool,
	};
}

export type Context = inferAsyncReturnType<typeof createContext>;
