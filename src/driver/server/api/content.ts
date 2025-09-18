import { entityIdSchema } from '#domain/shared/infra/apiSchema/entity.js';
import { topicQuerySchema } from '#domain/shared/infra/apiSchema/topic.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryTopics: publicProcedure
    .input(topicQuerySchema.optional())
    .query(({ ctx: { contentService }, input }) => contentService.queryAllTopics(input)),

  queryLinksOf: publicProcedure
    .input(entityIdSchema)
    .query(({ ctx: { contentService }, input }) => contentService.queryLinksOf(input)),
});
