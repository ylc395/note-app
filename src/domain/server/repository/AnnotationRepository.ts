import type { EntityId } from '#domain/shared/model/entity.js';
import type { Annotation, AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import type { EntityMaterial } from '#domain/shared/model/material.js';

export type AnnotationPatch = AnnotationPatchDTO & Partial<Pick<Annotation, 'updatedAt'>>;

export interface AnnotationRepository {
  create: (annotation: Annotation) => Promise<Annotation>;
  findAllByEntityId: (entityId: EntityId, config?: { isAvailableOnly?: boolean }) => Promise<Annotation[]>;
  findAllTargets: (ids: Annotation['id'][]) => Promise<Record<Annotation['id'], Omit<EntityMaterial, 'file'>>>;
  update: (annotationId: Annotation['id'], patch: AnnotationPatch) => Promise<boolean>;
}
