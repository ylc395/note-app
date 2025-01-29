import { topicQuerySchema } from '#domain/shared/infra/apiSchema/content.js';
import { entityIdSchema } from '#domain/shared/infra/apiSchema/entity.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryTopics: publicProcedure
    .input(topicQuerySchema.optional())
    .query(({ ctx: { contentService } }) => contentService.queryAllTopics()),

  queryLinksOf: publicProcedure
    .input(entityIdSchema)
    .query(({ ctx: { contentService }, input }) => contentService.queryLinksOf(input)),
});
