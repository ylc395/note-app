import { tuple } from 'zod';
import {
  materialDTOSchema,
  clientMaterialQuerySchema,
  materialPatchDTOSchema,
  materialSchema,
} from '#domain/shared/infra/schema/material.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  query: publicProcedure
    .input(clientMaterialQuerySchema)
    .query(({ input: query, ctx: { materialService } }) => materialService.query(query)),

  queryOne: publicProcedure
    .input(materialSchema.shape.id)
    .query(({ input: id, ctx: { materialService } }) => materialService.queryOne(id)),

  getBlob: publicProcedure
    .input(materialSchema.shape.id)
    .query(({ input: id, ctx: { materialService } }) => materialService.getBlob(id)),

  create: publicProcedure
    .input(materialDTOSchema)
    .mutation(({ input: dto, ctx: { materialService } }) => materialService.create(dto)),

  updateOne: publicProcedure
    .input(tuple([materialSchema.shape.id, materialPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { materialService } }) => materialService.updateOne(id, patch)),

  batchUpdate: publicProcedure
    .input(tuple([materialSchema.shape.id.array(), materialPatchDTOSchema]))
    .mutation(({ input: [ids, material], ctx: { materialService } }) => materialService.batchUpdate(ids, material)),

  queryPath: publicProcedure
    .input(materialSchema.shape.id)
    .query(({ input: id, ctx: { entityService } }) => entityService.getPath(id)),
});
