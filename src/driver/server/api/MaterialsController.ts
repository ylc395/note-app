import { string, tuple } from 'zod';
import {
  materialDTOSchema,
  clientMaterialQuerySchema,
  materialPatchDTOSchema,
} from '@domain/shared/infra/schema/material.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  query: publicProcedure
    .input(clientMaterialQuerySchema)
    .query(({ input: query, ctx: { materialService } }) => materialService.query(query)),

  queryPath: publicProcedure
    .input(string())
    .query(({ input: id, ctx: { entityService } }) => entityService.getPath(id)),

  queryOne: publicProcedure
    .input(string())
    .query(({ input: id, ctx: { materialService } }) => materialService.queryOne(id)),

  getBlob: publicProcedure
    .input(string())
    .query(({ input: id, ctx: { materialService } }) => materialService.getBlob(id)),

  create: publicProcedure
    .input(materialDTOSchema)
    .mutation(({ input: dto, ctx: { materialService } }) => materialService.create(dto)),

  updateOne: publicProcedure
    .input(tuple([string(), materialPatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { materialService } }) => materialService.updateOne(id, patch)),

  batchUpdate: publicProcedure
    .input(tuple([string().array(), materialPatchDTOSchema]))
    .mutation(({ input: [ids, material], ctx: { materialService } }) => materialService.batchUpdate(ids, material)),
});
