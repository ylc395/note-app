import { container } from 'tsyringe';
import { string, tuple } from 'zod';

import { newMaterialDTOSchema, clientMaterialQuerySchema, materialPatchDTOSchema } from '@domain/model/material.js';
import MaterialService from '@domain/service/MaterialService.js';

import { publicProcedure, router } from './trpc.js';

const materialProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { materialService: container.resolve(MaterialService) } });
});

export default router({
  query: materialProcedure
    .input(clientMaterialQuerySchema)
    .query(({ input: query, ctx: { materialService } }) => materialService.query(query)),

  queryPath: materialProcedure
    .input(string())
    .query(({ input: id, ctx: { materialService } }) => materialService.getPath(id)),

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
});
