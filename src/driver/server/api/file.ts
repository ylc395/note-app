import { fileDTOSchema } from '#domain/shared/infra/apiSchema/file.js';
import { string } from 'zod';
import { publicProcedure, router } from './trpc.js';

export default router({
  upload: publicProcedure
    .input(fileDTOSchema)
    .mutation(({ ctx: { fileService }, input: file }) => fileService.createFile(file)),

  queryOneByHash: publicProcedure
    .input(string())
    .query(({ ctx: { fileService }, input: hash }) => fileService.queryFileByHash(hash)),

  queryOneById: publicProcedure
    .input(string())
    .query(({ ctx: { fileService }, input: id }) => fileService.queryFileById(id)),
});
