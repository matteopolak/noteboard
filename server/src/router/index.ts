import { observable } from '@trpc/server/observable';
import { router, procedure } from '../trpc';
import TypedEmitter from 'typed-emitter';
import EventEmitter from 'events';
import { z } from 'zod';

type Events = {
  updateCells: (cells: Cell[]) => void;
};

type Cell = {
  x: number;
  y: number;
  color: number;
};

const ee = new EventEmitter() as TypedEmitter<Events>;

export const appRouter = router({
  live: procedure.subscription(async ({ ctx }) => {
    return observable<Cell[]>((s) => {
      ee.on('updateCells', s.next);

      return () => {
        ee.off('updateCells', s.next);
      };
    });
  }),

  updateColor: procedure
    .input(
      z.object({
        x: z.number().int(),
        y: z.number().int(),
        color: z.number().int(),
      })
    )
    .subscription(async ({ ctx, input }) => {
      ee.emit('updateCells', [input]);

      await ctx.pool.query(
        'INSERT INTO "cell" VALUES ($1, $2, $3) ON CONFLICT (x, y) DO UPDATE SET color = EXCLUDED.color',
        [input.x, input.y, input.color]
      );
    }),

  getChunk: procedure
    .input(
      z.object({
        x: z.number().int(),
        y: z.number().int(),
        radius: z.number().int(),
      })
    )
    .subscription(async ({ ctx, input }) => {
      const { rows: cells } = await ctx.pool.query<Cell>(
        'SELECT * FROM "cell" WHERE ($1 - $3) <= x AND ($1 + $3) >= x AND ($2 - $3) <= y AND ($2 + $3) >= y',
        [input.x, input.y, input.radius]
      );

      ee.emit('updateCells', cells);
    }),
});

export type Router = typeof appRouter;
