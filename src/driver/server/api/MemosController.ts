import { tuple } from 'zod';

import {
  clientMemoQuerySchema,
  memoPatchDTOSchema,
  memoDTOSchema,
  durationSchema,
  memoSchema,
} from '#domain/shared/infra/schema/memo.js';

import { publicProcedure, router } from './trpc.js';

export default router({
  queryList: publicProcedure
    .input(clientMemoQuerySchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.queryList(query)),

  create: publicProcedure
    .input(memoDTOSchema)
    .mutation(({ input: dto, ctx: { memoService } }) => memoService.create(dto)),

  updateOne: publicProcedure
    .input(tuple([memoSchema.shape.id, memoPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { memoService } }) => memoService.updateOne(id, patch)),

  queryDates: publicProcedure
    .input(durationSchema)
    .query(({ input: duration, ctx: { memoService } }) => memoService.queryAvailableDates(duration)),
});
