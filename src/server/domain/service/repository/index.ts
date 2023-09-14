import type { NoteRepository } from './NoteRepository';
import type { RecyclablesRepository } from './RecyclableRepository';
import type { StarRepository } from './StarRepository';
import type { FileRepository } from './FileRepository';
import type { MemoRepository } from './MemoRepository';
import type { MaterialRepository } from './MaterialRepository';
import type { RevisionRepository } from './RevisionRepository';
import type { SynchronizationRepository } from './SynchronizationRepository';
import type { ContentRepository } from './ContentRepository';

export default interface Repositories {
  notes: NoteRepository;
  recyclables: RecyclablesRepository;
  stars: StarRepository;
  files: FileRepository;
  memos: MemoRepository;
  materials: MaterialRepository;
  revisions: RevisionRepository;
  synchronization: SynchronizationRepository;
  contents: ContentRepository;
}
