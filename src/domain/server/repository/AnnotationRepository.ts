import type { EntityId } from '#domain/shared/model/entity.js';
import type { Annotation, AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import type { Note } from '#domain/shared/model/note';

export type AnnotationPatch = AnnotationPatchDTO & Partial<Pick<Annotation, 'updatedAt'>>;

export interface AnnotationRepository {
  create: (annotation: Annotation) => Promise<Annotation>;
  findAllByEntityId: (entityId: EntityId, config?: { isAvailableOnly?: boolean }) => Promise<Annotation[]>;
  findOneById: (annotationId: Annotation['id'], config?: { isAvailableOnly?: boolean }) => Promise<Annotation | null>;
  findAllTargets: (ids: Annotation['id'][]) => Promise<Record<Annotation['id'], Note>>;
  update: (annotationId: Annotation['id'], patch: AnnotationPatch) => Promise<boolean>;
}
