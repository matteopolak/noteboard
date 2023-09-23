import { router, procedure } from '../trpc';

const app = router({
	greeting: procedure.query(async ({ ctx }) => {
		return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}`;
	}),
});

export default app;
export type Router = typeof app;
