import 'dotenv/config';

import cors from 'cors';
import { createHTTPServer } from '@trpc/server/adapters/standalone';

import './wss';
import { appRouter } from './router';
import { createContext } from './context';

const server = createHTTPServer({
	router: appRouter,
	createContext,
	middleware: cors(),
});

server.listen(4038);

console.log('✅ HTTP Server listening on http://localhost:4038');
