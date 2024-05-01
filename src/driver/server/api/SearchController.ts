import { searchParamsSchema } from '@domain/shared/model/search.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  search: publicProcedure.input(searchParamsSchema).mutation(({ input, ctx: { searchService } }) => {
    return searchService.search(input);
  }),
});
