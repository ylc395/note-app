import { entityIdSchema } from '@domain/shared/infra/schema/entity.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryTopics: publicProcedure.query(({ ctx: { contentService } }) => contentService.queryAllTopics()),

  queryLinksOf: publicProcedure
    .input(entityIdSchema)
    .query(({ ctx: { contentService }, input }) => contentService.queryLinksOf(input)),
});
