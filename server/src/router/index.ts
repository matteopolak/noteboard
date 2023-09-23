import { observable } from '@trpc/server/observable';
import { router, procedure } from '../trpc';

export const appRouter = router({
	greeting: procedure.query(async ({ ctx }) => {
		return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}`;
	}),
	live: procedure.subscription(async ({ ctx }) => {
		return observable(s => {
			s.next('hello world');
		});
	}),
});

export type Router = typeof appRouter;
