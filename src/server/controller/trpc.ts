import { initTRPC } from '@trpc/server';
import { container } from 'tsyringe';

import NoteService from '@domain/service/NoteService.js';
import MaterialService from '@domain/service/MaterialService.js';
import VersionService from '@domain/service/VersionService.js';
import StarService from '@domain/service/StarService.js';
import FileService from '@domain/service/FileService/index.js';
import MemoService from '@domain/service/MemoService.js';
import AnnotationService from '@domain/service/AnnotationService.js';
import EntityService from '@domain/service/EntityService.js';
import ContentService from '@domain/service/ContentService.js';
import SearchService from '@domain/service/SearchService.js';

const t = initTRPC.context().create();
export const router = t.router;
export const publicProcedure = t.procedure.use(({ next }) => {
  return next({
    ctx: {
      fileService: container.resolve(FileService),
      entityService: container.resolve(EntityService),
      noteService: container.resolve(NoteService),
      memoService: container.resolve(MemoService),
      annotationService: container.resolve(AnnotationService),
      materialService: container.resolve(MaterialService),
      starService: container.resolve(StarService),
      versionService: container.resolve(VersionService),
      contentService: container.resolve(ContentService),
      searchService: container.resolve(SearchService),
    },
  });
});
