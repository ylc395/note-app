import { starDTOSchema } from '#domain/shared/infra/apiSchema/star.js';
import { entityIdSchema } from '#domain/shared/infra/apiSchema/entity.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  query: publicProcedure.query(({ ctx: { starService } }) => {
    return starService.query();
  }),

  create: publicProcedure.input(starDTOSchema).mutation(({ input, ctx: { starService } }) => {
    return starService.create(input);
  }),

  remove: publicProcedure.input(entityIdSchema).mutation(({ input, ctx: { starService } }) => {
    return starService.remove(input);
  }),
});
