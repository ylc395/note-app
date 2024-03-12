import { string } from 'zod';

import { fileDTOSchema } from '@domain/model/file.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  upload: publicProcedure
    .input(fileDTOSchema)
    .mutation(({ ctx: { fileService }, input: file }) => fileService.createFile(file)),

  queryOne: publicProcedure
    .input(string())
    .query(({ ctx: { fileService }, input }) => fileService.queryFileById(input)),
});
