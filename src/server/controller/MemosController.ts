import { container } from 'tsyringe';
import { string, tuple } from 'zod';

import { clientMemoQuerySchema, memoPatchDTOSchema, memoDTOSchema, durationSchema } from '@domain/model/memo.js';
import MemoService from '@domain/service/MemoService.js';

import { publicProcedure, router } from './trpc.js';

const memoProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { memoService: container.resolve(MemoService) } });
});

export default router({
  query: memoProcedure
    .input(clientMemoQuerySchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.query(query)),

  create: memoProcedure
    .input(memoDTOSchema)
    .mutation(({ input: dto, ctx: { memoService } }) => memoService.create(dto)),

  updateOne: memoProcedure
    .input(tuple([string(), memoPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { memoService } }) => memoService.updateOne(id, patch)),

  queryDates: memoProcedure
    .input(durationSchema)
    .query(({ input: duration, ctx: { memoService } }) => memoService.queryAvailableDates(duration)),
});
