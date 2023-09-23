import 'dotenv/config';

import { createHTTPServer } from '@trpc/server/adapters/standalone';

import './wss';
import { appRouter } from './router';
import { createContext } from './context';

const server = createHTTPServer({
	router: appRouter,
	createContext,
});
 
server.listen(4038);

console.log('✅ HTTP Server listening on http://localhost:4038');
