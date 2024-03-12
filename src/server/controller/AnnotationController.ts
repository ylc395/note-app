import { string, tuple } from 'zod';

import { annotationDTOSchema, annotationPatchDTOSchema } from '@shared/domain/model/annotation.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryByEntityId: publicProcedure
    .input(string())
    .query(({ input: id, ctx: { annotationService } }) => annotationService.queryByEntityId(id)),

  create: publicProcedure
    .input(annotationDTOSchema)
    .mutation(({ input: dto, ctx: { annotationService } }) => annotationService.create(dto)),

  updateOne: publicProcedure
    .input(tuple([string(), annotationPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { annotationService } }) => annotationService.update(id, patch)),
});
