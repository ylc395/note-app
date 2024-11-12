import { publicProcedure, router } from './trpc.js';
import { searchRequestSchema } from '#domain/shared/infra/schema/search.js';

export default router({
  search: publicProcedure.input(searchRequestSchema).mutation(({ input, ctx: { searchService } }) => {
    return searchService.search(input);
  }),
});
