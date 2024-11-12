import { fileDTOSchema } from '#domain/shared/infra/apiSchema/file.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  upload: publicProcedure
    .input(fileDTOSchema)
    .mutation(({ ctx: { fileService }, input: file }) => fileService.createFile(file)),
});
