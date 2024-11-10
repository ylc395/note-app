import type { Repositories } from '@domain/server/repository/index.js';

import notes from './NoteRepository.js';
import stars from './StarRepository.js';
import files from './FileRepository.js';
import memos from './MemoRepository.js';
import materials from './MaterialRepository.js';
import annotations from './AnnotationRepository.js';
import contents from './ContentRepository.js';
import entities from './EntityRepository.js';
import recyclables from './RecyclableRepository.js';
import revisions from './RevisionRepository.js';

import type SqliteDatabase from '../Database.js';

const repositories: {
  [K in keyof Repositories]: { new (db: SqliteDatabase): Repositories[K] };
} = {
  notes,
  stars,
  files,
  memos,
  materials,
  annotations,
  contents,
  entities,
  recyclables,
  revisions,
};

export function getRepositories(db: SqliteDatabase) {
  return new Proxy(
    {},
    {
      get: (_, p) => {
        return new repositories[p as keyof typeof repositories](db);
      },
    },
  );
}
