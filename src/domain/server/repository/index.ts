import { Type } from 'di-wise';
import type { NoteRepository } from './noteRepository.js';
import type { StarRepository } from './starRepository.js';
import type { FileRepository } from './fileRepository.js';
import type { MemoRepository } from './memoRepository.js';
import type { ContentRepository } from './contentRepository.js';
import type { EntityRepository } from './entityRepository.js';
import type { AnnotationRepository } from './annotationRepository.js';
import type { RecyclablesRepository } from './recyclableRepository.js';
import type { RevisionRepository } from './revisionRepository.js';

export interface Repositories {
  notes: NoteRepository;
  stars: StarRepository;
  files: FileRepository;
  memos: MemoRepository;
  annotations: AnnotationRepository;
  entities: EntityRepository;
  contents: ContentRepository;
  recyclables: RecyclablesRepository;
  revisions: RevisionRepository;
}

export const token = Type<Repositories>('Repositories');
