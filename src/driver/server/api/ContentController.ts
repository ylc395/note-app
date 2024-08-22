import { entityIdSchema } from '@domain/shared/infra/schema/entity.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryLinks: publicProcedure
    .input(entityIdSchema)
    .query(({ input: entityId, ctx: { contentService } }) => contentService.queryEntityLinks(entityId)),

  queryTopics: publicProcedure.query(({ ctx: { contentService } }) => contentService.queryAllTopics()),
});
