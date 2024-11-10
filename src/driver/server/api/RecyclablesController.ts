import { entityIdSchema } from '@domain/shared/infra/schema/entity.js';
import { recyclablesDTOSchema } from '@domain/shared/infra/schema/recyclable.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryAll: publicProcedure.query(({ ctx: { recyclableService } }) => {
    return recyclableService.queryAll();
  }),

  recover: publicProcedure.input(entityIdSchema).mutation(({ input, ctx: { recyclableService } }) => {
    return recyclableService.recover(input);
  }),

  batchCreate: publicProcedure.input(recyclablesDTOSchema).mutation(({ input, ctx: { recyclableService } }) => {
    return recyclableService.batchCreate(input);
  }),
});
