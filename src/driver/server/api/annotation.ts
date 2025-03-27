import { tuple } from 'zod';

import { annotationDTOSchema, annotationPatchDTOSchema } from '#domain/shared/infra/apiSchema/annotation.js';
import { entityIdSchema } from '#domain/shared/infra/apiSchema/entity.js';
import { isSelectors, type AnnotationDTO, type AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  queryByEntityId: publicProcedure
    .input(entityIdSchema)
    .query(({ input: id, ctx: { annotationService } }) => annotationService.queryByEntityId(id)),

  queryOne: publicProcedure
    .input(entityIdSchema)
    .query(({ input: id, ctx: { annotationService } }) => annotationService.queryOne(id)),

  create: publicProcedure
    .input(
      annotationDTOSchema.refine((value): value is AnnotationDTO =>
        Array.isArray(value.selectors) ? isSelectors(value.selectors) : true,
      ),
    )
    .mutation(({ input: dto, ctx: { annotationService } }) => annotationService.create(dto)),

  updateOne: publicProcedure
    .input(
      tuple([
        entityIdSchema,
        annotationPatchDTOSchema.refine((value): value is AnnotationPatchDTO =>
          Array.isArray(value.selectors) ? isSelectors(value.selectors) : true,
        ),
      ]),
    )
    .mutation(({ input: [id, patch], ctx: { annotationService } }) => annotationService.updateOne(id, patch)),
});
