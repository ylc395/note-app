import { container } from 'tsyringe';
import { string } from 'zod';

import { fileDTOSchema } from '@domain/model/file.js';
import FileService from '@domain/service/FileService/index.js';

import { publicProcedure, router } from './trpc.js';

const fileProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { fileService: container.resolve(FileService) } });
});

export default router({
  upload: fileProcedure
    .input(fileDTOSchema)
    .mutation(({ ctx: { fileService }, input: file }) => fileService.createFile(file)),
  queryOne: fileProcedure.input(string()).query(({ ctx: { fileService }, input }) => fileService.queryFileById(input)),
});
