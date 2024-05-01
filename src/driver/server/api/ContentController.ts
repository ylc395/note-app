import { string } from 'zod';

import { publicProcedure, router } from './trpc.js';

export default router({
  queryLinks: publicProcedure
    .input(string())
    .query(({ input: entityId, ctx: { contentService } }) => contentService.queryEntityLinks(entityId)),

  queryTopics: publicProcedure.query(({ ctx: { contentService } }) => contentService.queryAllTopics()),
});
