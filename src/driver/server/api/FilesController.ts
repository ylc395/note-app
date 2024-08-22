import { fileDTOSchema, fileSchema } from '@domain/shared/infra/schema/file.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  upload: publicProcedure
    .input(fileDTOSchema)
    .mutation(({ ctx: { fileService }, input: file }) => fileService.createFile(file)),

  queryOne: publicProcedure
    .input(fileSchema.shape.id)
    .query(({ ctx: { fileService }, input }) => fileService.queryFileById(input)),
});
