import type { NoteRepository } from './NoteRepository.js';
import type { RecyclablesRepository } from './RecyclableRepository.js';
import type { StarRepository } from './StarRepository.js';
import type { FileRepository } from './FileRepository.js';
import type { MemoRepository } from './MemoRepository.js';
import type { MaterialRepository } from './MaterialRepository.js';
import type { RevisionRepository } from './RevisionRepository.js';
import type { SynchronizationRepository } from './SynchronizationRepository.js';
import type { ContentRepository } from './ContentRepository.js';
import type { EntityRepository } from './EntityRepository.js';
import type { AnnotationRepository } from './AnnotationRepository.js';

export default interface Repositories {
  notes: NoteRepository;
  recyclables: RecyclablesRepository;
  stars: StarRepository;
  files: FileRepository;
  memos: MemoRepository;
  materials: MaterialRepository;
  annotations: AnnotationRepository;
  revisions: RevisionRepository;
  synchronization: SynchronizationRepository;
  contents: ContentRepository;
  entities: EntityRepository;
}
