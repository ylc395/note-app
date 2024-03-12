import { starDTOSchema } from '@domain/model/star.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  query: publicProcedure.query(({ ctx: { starService } }) => {
    return starService.query();
  }),

  create: publicProcedure.input(starDTOSchema).mutation(({ input, ctx: { starService } }) => {
    return starService.create(input);
  }),

  remove: publicProcedure.input(starDTOSchema).mutation(({ input, ctx: { starService } }) => {
    return starService.remove(input);
  }),
});
