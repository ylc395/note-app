import { entityIdSchema } from '@domain/shared/infra/schema/entity.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryAll: publicProcedure.query(({ ctx: { recyclableService } }) => {
    return recyclableService.queryAll();
  }),

  remove: publicProcedure.input(entityIdSchema).mutation(({ input, ctx: { recyclableService } }) => {
    return recyclableService.remove(input);
  }),

  batchCreate: publicProcedure.input(entityIdSchema.array()).mutation(({ input, ctx: { recyclableService } }) => {
    return recyclableService.batchCreate(input);
  }),
});
