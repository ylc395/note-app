import { string, tuple } from 'zod';

import {
  clientMemoQuerySchema,
  memoPatchDTOSchema,
  memoDTOSchema,
  durationSchema,
  clientTreeFragmentQuerySchema,
} from '@domain/model/memo.js';

import { publicProcedure, router } from './trpc.js';

export default router({
  query: publicProcedure
    .input(clientMemoQuerySchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.query(query)),

  queryTreeFragment: publicProcedure
    .input(clientTreeFragmentQuerySchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.queryFragment(query)),

  create: publicProcedure
    .input(memoDTOSchema)
    .mutation(({ input: dto, ctx: { memoService } }) => memoService.create(dto)),

  updateOne: publicProcedure
    .input(tuple([string(), memoPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { memoService } }) => memoService.updateOne(id, patch)),

  queryDates: publicProcedure
    .input(durationSchema)
    .query(({ input: duration, ctx: { memoService } }) => memoService.queryAvailableDates(duration)),
});
