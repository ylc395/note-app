import { tuple } from 'zod';
import { publicProcedure, router } from './trpc.js';
import { revisionPatchDTOSchema, revisionSchema } from '#domain/shared/infra/apiSchema/revision.js';
import { entityIdSchema } from '#domain/shared/infra/apiSchema/entity.js';

export default router({
  update: publicProcedure
    .input(tuple([revisionSchema.shape.id, revisionPatchDTOSchema]))
    .mutation(({ ctx: { revisionService }, input }) => {
      return revisionService.update(...input);
    }),

  queryAll: publicProcedure.input(entityIdSchema).query(({ ctx: { revisionService }, input }) => {
    return revisionService.queryRevisionsOf(input);
  }),
});
