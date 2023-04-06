import type { NoteRepository } from './NoteRepository';
import type { RecyclablesRepository } from './RecyclableRepository';
import type { StarRepository } from './StarRepository';
import type { FileRepository } from './FileRepository';
import type { MemoRepository } from './MemoRepository';
import type { MaterialRepository } from './MaterialRepository';

export default interface Repositories {
  notes: NoteRepository;
  recyclables: RecyclablesRepository;
  stars: StarRepository;
  files: FileRepository;
  memos: MemoRepository;
  materials: MaterialRepository;
}

const REPOSITORY_NAMES = [
  'notes',
  'recyclables',
  'stars',
  'files',
  'memos',
  'materials',
] satisfies (keyof Repositories)[];

export const isRepositoryName = function (key: string | symbol): key is keyof Repositories {
  return (REPOSITORY_NAMES as (string | symbol)[]).includes(key);
};
