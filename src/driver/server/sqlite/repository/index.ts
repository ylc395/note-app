import notes from './NoteRepository.js';
import stars from './StarRepository.js';
import files from './FileRepository.js';
import memos from './MemoRepository.js';
import materials from './MaterialRepository.js';
import annotations from './AnnotationRepository.js';
import contents from './ContentRepository.js';
import entities from './EntityRepository.js';

import type SqliteDatabase from '../Database.js';

const repositories = {
  notes,
  stars,
  files,
  memos,
  materials,
  annotations,
  contents,
  entities,
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
