import { tuple } from 'zod';

import {
  clientMemoQuerySchema,
  memoCountQuerySchema,
  memoPatchDTOSchema,
  memoDTOSchema,
  durationSchema,
  memoSchema,
} from '#domain/shared/infra/apiSchema/memo.js';
import { entityIdSchema } from '#domain/shared/infra/apiSchema/entity.js';

import { publicProcedure, router } from './trpc.js';

export default router({
  queryList: publicProcedure
    .input(clientMemoQuerySchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.queryList(query)),

  queryOneById: publicProcedure
    .input(entityIdSchema)
    .query(({ input: query, ctx: { memoService } }) => memoService.queryOneById(query, true)),

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
    .input(memoCountQuerySchema)
    .query(({ input: countQuery, ctx: { memoService } }) => memoService.queryCount(countQuery)),

  queryAvailableDateRange: publicProcedure.query(({ ctx: { memoService } }) => memoService.queryAvailableDateRange()),

  queryReferrers: publicProcedure
    .input(entityIdSchema)
    .query(({ input: memoId, ctx: { memoService } }) => memoService.queryReferrers(memoId)),
});
