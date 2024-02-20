import { container } from 'tsyringe';

import StarService from '@domain/service/StarService.js';
import { starDTOSchema } from '@domain/model/star.js';
import { publicProcedure, router } from './trpc.js';

const starProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { starService: container.resolve(StarService) } });
});

export default router({
  query: starProcedure.query(({ ctx: { starService } }) => {
    return starService.query();
  }),

  create: starProcedure.input(starDTOSchema).mutation(({ input, ctx: { starService } }) => {
    return starService.create(input);
  }),

  remove: starProcedure.input(starDTOSchema).mutation(({ input, ctx: { starService } }) => {
    return starService.remove(input);
  }),
});
