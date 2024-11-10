import { tuple } from 'zod';
import { publicProcedure, router } from './trpc.js';
import { revisionPatchDTOSchema, revisionSchema } from '@domain/shared/infra/schema/revision.js';

export default router({
  update: publicProcedure
    .input(tuple([revisionSchema.shape.id, revisionPatchDTOSchema]))
    .mutation(({ ctx: { revisionService }, input }) => {
      return revisionService.update(...input);
    }),
});
