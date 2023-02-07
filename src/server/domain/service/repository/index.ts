import type { NoteRepository } from './NoteRepository';
import type { RecyclablesRepository } from './RecyclableRepository';

export default interface Repositories {
  notes: NoteRepository;
  recyclables: RecyclablesRepository;
}
