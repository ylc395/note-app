import type { NoteRepository } from './NoteRepository';
import type { RecyclablesRepository } from './RecyclableRepository';
import type { StarRepository } from './StarRepository';
import type { FileRepository } from './FileRepository';

export default interface Repositories {
  notes: NoteRepository;
  recyclables: RecyclablesRepository;
  stars: StarRepository;
  files: FileRepository;
}

const REPOSITORY_NAMES = ['notes', 'recyclables', 'stars', 'files'] satisfies (keyof Repositories)[];

export const isRepositoryName = function (key: string | symbol): key is keyof Repositories {
  return (REPOSITORY_NAMES as (string | symbol)[]).includes(key);
};
