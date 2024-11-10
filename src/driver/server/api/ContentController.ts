import { publicProcedure, router } from './trpc.js';

export default router({
  queryTopics: publicProcedure.query(({ ctx: { contentService } }) => contentService.queryAllTopics()),
});
