import { router, procedure } from '../trpc';

export const appRouter = router({
	greeting: procedure.query(async ({ ctx }) => {
		return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}`;
	}),
});

export type Router = typeof appRouter;
