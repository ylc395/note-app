import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import type { ObservedValueOf } from 'rxjs';

import { fileDTOSchema } from '#domain/shared/infra/apiSchema/file.js';
import type FileService from '#domain/server/service/FileService/index.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  upload: publicProcedure
    .input(fileDTOSchema)
    .mutation(({ ctx: { fileService }, input: file }) => fileService.createFile(file)),

  queryOneByHash: publicProcedure
    .input(z.string())
    .query(({ ctx: { fileService }, input: hash }) => fileService.queryFileByHash(hash)),

  queryOneById: publicProcedure
    .input(z.string())
    .query(({ ctx: { fileService }, input: id }) => fileService.queryFileById(id)),

  queryRemoteMetadata: publicProcedure
    .input(z.string())
    .query(({ ctx: { fileService }, input: url }) => fileService.queryRemoteMetadata(url)),

  download: publicProcedure.input(z.url()).subscription(({ ctx: { fileService }, input: url }) => {
    return observable<ObservedValueOf<ReturnType<FileService['download']>>>((subscriber) => {
      const subscription = fileService.download(url).subscribe(subscriber);
      return () => subscription.unsubscribe();
    });
  }),
});
