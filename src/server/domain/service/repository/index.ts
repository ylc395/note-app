import type { NoteRepository } from './NoteRepository';
import type { RecyclablesRepository } from './RecyclableRepository';
import type { StarRepository } from './StarRepository';
import type { ResourceRepository } from './ResourceRepository';
import type { MemoRepository } from './MemoRepository';
import type { MaterialRepository } from './MaterialRepository';
import type { RevisionRepository } from './RevisionRepository';
import type { SynchronizationRepository } from './SynchronizationRepository';

export default interface Repositories {
  notes: NoteRepository;
  recyclables: RecyclablesRepository;
  stars: StarRepository;
  resources: ResourceRepository;
  memos: MemoRepository;
  materials: MaterialRepository;
  revisions: RevisionRepository;
  synchronization: SynchronizationRepository;
}
