import { container } from 'tsyringe';
import { string, tuple } from 'zod';

import AnnotationService from '@domain/service/AnnotationService.js';
import { annotationDTOSchema, annotationPatchDTOSchema } from '@shared/domain/model/annotation.js';

import { publicProcedure, router } from './trpc.js';

const annotationProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { annotationService: container.resolve(AnnotationService) } });
});

export default router({
  queryByEntityId: annotationProcedure
    .input(string())
    .query(({ input: id, ctx: { annotationService } }) => annotationService.queryByEntityId(id)),

  create: annotationProcedure
    .input(annotationDTOSchema)
    .mutation(({ input: dto, ctx: { annotationService } }) => annotationService.create(dto)),

  updateOne: annotationProcedure
    .input(tuple([string(), annotationPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { annotationService } }) => annotationService.update(id, patch)),
});
