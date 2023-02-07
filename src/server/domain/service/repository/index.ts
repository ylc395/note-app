import type { NoteRepository } from './NoteRepository';
import type { RecyclablesRepository } from './RecyclableRepository';

export default interface Repositories {
  notes: NoteRepository;
  recyclables: RecyclablesRepository;
}

const REPOSITORY_NAMES: (keyof Repositories)[] = ['notes', 'recyclables'];

export const isRepositoryName = function (key: string | symbol): key is keyof Repositories {
  return (REPOSITORY_NAMES as (string | symbol)[]).includes(key);
};
