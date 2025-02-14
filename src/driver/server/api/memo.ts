import { tuple } from 'zod';

import {
  clientMemoQuerySchema,
  memoPatchDTOSchema,
  memoDTOSchema,
  durationSchema,
  memoSchema,
  countQuerySchema,
} from '#domain/shared/infra/apiSchema/memo.js';
import { entityIdSchema } from '#domain/shared/infra/apiSchema/entity.js';

import { publicProcedure, router } from './trpc.js';

export default router({
  queryList: publicProcedure
    .input(clientMemoQuerySchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.queryList(query)),

  queryOne: publicProcedure
    .input(entityIdSchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.queryOne(query, true)),

  create: publicProcedure
    .input(memoDTOSchema)
    .mutation(({ input: dto, ctx: { memoService } }) => memoService.create(dto)),

  updateOne: publicProcedure
    .input(tuple([memoSchema.shape.id, memoPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { memoService } }) => memoService.updateOne(id, patch)),

  queryDates: publicProcedure
    .input(durationSchema)
    .query(({ input: duration, ctx: { memoService } }) => memoService.queryAvailableDates(duration)),

  queryCount: publicProcedure
    .input(countQuerySchema.optional())
    .query(({ input: CountQuery, ctx: { memoService } }) => memoService.queryCount(CountQuery)),

  queryAvailableDateRange: publicProcedure.query(({ ctx: { memoService } }) => memoService.queryAvailableDateRange()),

  queryReferrers: publicProcedure
    .input(entityIdSchema)
    .query(({ input: memoId, ctx: { memoService } }) => memoService.queryReferrers(memoId)),

  queryLinkSet: publicProcedure.query(({ ctx: { memoService } }) => memoService.queryLinkSet()),
});
