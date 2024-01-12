import { container } from 'tsyringe';
import { string, tuple } from 'zod';

import {
  newMaterialDTOSchema,
  clientMaterialQuerySchema,
  newAnnotationDTOSchema,
  materialPatchDTOSchema,
  annotationPatchDTOSchema,
} from '@domain/model/material.js';
import MaterialService from '@domain/service/MaterialService.js';

import { publicProcedure, router } from './trpc.js';

const materialProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { materialService: container.resolve(MaterialService) } });
});

export default router({
  query: materialProcedure
    .input(clientMaterialQuerySchema)
    .query(({ input: { to, ...query }, ctx: { materialService } }) =>
      to ? materialService.getTreeFragment(to) : materialService.query(query),
    ),

  queryOne: materialProcedure
    .input(string())
    .query(({ input: id, ctx: { materialService } }) => materialService.queryOne(id)),

  getBlob: materialProcedure
    .input(string())
    .query(({ input: id, ctx: { materialService } }) => materialService.getBlob(id)),

  create: materialProcedure
    .input(newMaterialDTOSchema)
    .mutation(({ input: dto, ctx: { materialService } }) => materialService.create(dto)),

  updateOne: materialProcedure
    .input(tuple([string(), materialPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { materialService } }) => materialService.updateOne(id, patch)),

  batchUpdate: materialProcedure
    .input(tuple([string().array(), materialPatchDTOSchema]))
    .mutation(({ input: [ids, material], ctx: { materialService } }) => materialService.batchUpdate(ids, material)),

  queryAnnotations: materialProcedure
    .input(string())
    .query(({ input: id, ctx: { materialService } }) => materialService.queryAnnotations(id)),

  createAnnotation: materialProcedure
    .input(tuple([string(), newAnnotationDTOSchema]))
    .mutation(({ input: [materialId, dto], ctx: { materialService } }) =>
      materialService.createAnnotation(materialId, dto),
    ),

  updateAnnotation: materialProcedure
    .input(tuple([string(), annotationPatchDTOSchema]))
    .mutation(({ input: [materialId, dto], ctx: { materialService } }) =>
      materialService.updateAnnotation(materialId, dto),
    ),

  removeAnnotation: materialProcedure
    .input(string())
    .mutation(({ input, ctx: { materialService } }) => materialService.removeAnnotation(input)),
});
