import type { Context } from './context';
import { initTRPC } from '@trpc/server';

const t = initTRPC.context<Context>().create();

export const middleware = t.middleware;
export const router = t.router;
export const procedure = t.procedure;
