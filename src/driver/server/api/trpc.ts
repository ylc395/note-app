import { initTRPC } from '@trpc/server';
import { container } from '#domain/shared/infra/singletons.js';
import { memoize } from 'lodash-es';

import NoteService from '#domain/server/service/NoteService.js';
import MaterialService from '#domain/server/service/MaterialService.js';
import StarService from '#domain/server/service/StarService.js';
import FileService from '#domain/server/service/FileService/index.js';
import MemoService from '#domain/server/service/MemoService.js';
import AnnotationService from '#domain/server/service/AnnotationService.js';
import EntityService from '#domain/server/service/EntityService.js';
import ContentService from '#domain/server/service/ContentService/index.js';
import SearchService from '#domain/server/service/SearchService.js';
import RecyclableService from '#domain/server/service/RecyclableService.js';
import RevisionService from '#domain/server/service/RevisionService.js';

const t = initTRPC.context().create();

const createContext = memoize(() => ({
  fileService: container.resolve(FileService),
  entityService: container.resolve(EntityService),
  noteService: container.resolve(NoteService),
  memoService: container.resolve(MemoService),
  annotationService: container.resolve(AnnotationService),
  materialService: container.resolve(MaterialService),
  starService: container.resolve(StarService),
  contentService: container.resolve(ContentService),
  searchService: container.resolve(SearchService),
  recyclableService: container.resolve(RecyclableService),
  revisionService: container.resolve(RevisionService),
}));

export const router = t.router;

export const publicProcedure = t.procedure.use(({ next, ctx }) => {
  return next({
    ctx: {
      ...createContext(),
      ...ctx,
    },
  });
});
