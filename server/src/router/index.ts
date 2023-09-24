import { observable } from '@trpc/server/observable';
import { router, procedure } from '../trpc';
import TypedEmitter from 'typed-emitter';
import EventEmitter from 'events';
import { z } from 'zod';

type Events = {
  updateCells: (cells: Cell[]) => void;
  removeCells: (cells: CellWithoutColor[]) => void;
};

type Cell = {
  x: number;
  y: number;
  color: number;
};

type CellWithoutColor = Omit<Cell, 'color'>;

const ee = new EventEmitter() as TypedEmitter<Events>;

export const appRouter = router({
  watchUpdate: procedure.subscription(() => {
    return observable<Cell[]>((s) => {
      ee.on('updateCells', s.next);

      return () => {
        ee.off('updateCells', s.next);
      };
    });
  }),
  watchRemove: procedure.subscription(() => {
    return observable<CellWithoutColor[]>((s) => {
      ee.on('removeCells', s.next);

      return () => {
        ee.off('removeCells', s.next);
      };
    });
  }),
  updateCell: procedure
    .input(
      z.object({
        x: z.number().int(),
        y: z.number().int(),
        color: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ee.emit('updateCells', [input]);

      await ctx.pool.query(
        'INSERT INTO "cell" VALUES ($1, $2, $3) ON CONFLICT (x, y) DO UPDATE SET color = EXCLUDED.color',
        [input.x, input.y, input.color]
      );
    }),
  requestChunkStream: procedure
    .input(
      z.object({
        x: z.number().int(),
        y: z.number().int(),
        width: z.number().int(),
        height: z.number().int(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { rows: cells } = await ctx.pool.query<Cell>(
        'SELECT * FROM "cell" WHERE (x >= $1 AND x <= ($1 + $3) AND y >= $2 AND y <= ($2 + $4))',
        [input.x, input.y, input.width, input.height]
      );

      ee.emit('updateCells', cells);
    }),
  getChunk: procedure
    .input(
      z.object({
        x: z.number().int(),
        y: z.number().int(),
        width: z.number().int(),
        height: z.number().int(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { rows: cells } = await ctx.pool.query<Cell>(
        'SELECT * FROM "cell" WHERE (x >= $1 AND x <= ($1 + $3) AND y >= $2 AND y <= ($2 + $4))',
        [input.x, input.y, input.width, input.height]
      );

      return cells;
    }),
  removeCell: procedure
    .input(z.object({ x: z.number().int(), y: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.pool.query('DELETE FROM "cell" WHERE x = $1 AND y = $2', [
        input.x,
        input.y,
      ]);

      ee.emit('removeCells', [{ x: input.x, y: input.y }]);
    }),
});

export type Router = typeof appRouter;
