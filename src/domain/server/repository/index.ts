import { InjectionToken } from 'tsyringe';
import type { NoteRepository } from './NoteRepository.js';
import type { StarRepository } from './StarRepository.js';
import type { FileRepository } from './FileRepository.js';
import type { MemoRepository } from './MemoRepository.js';
import type { MaterialRepository } from './MaterialRepository.js';
import type { ContentRepository } from './ContentRepository.js';
import type { EntityRepository } from './EntityRepository.js';
import type { AnnotationRepository } from './AnnotationRepository.js';
import type { RecyclablesRepository } from './RecyclableRepository.js';

interface Repositories {
  notes: NoteRepository;
  stars: StarRepository;
  files: FileRepository;
  memos: MemoRepository;
  materials: MaterialRepository;
  annotations: AnnotationRepository;
  entities: EntityRepository;
  contents: ContentRepository;
  recyclables: RecyclablesRepository;
}

export const token: InjectionToken<Repositories> = Symbol('Repositories');
