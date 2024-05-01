import type { EntityId } from '@domain/shared/model/entity.js';
import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '@domain/shared/model/annotation.js';

export interface AnnotationRepository {
  create: (annotation: AnnotationDTO) => Promise<Annotation>;
  findAllByEntityId: (entityId: EntityId) => Promise<Annotation[]>;
  update: (annotationId: Annotation['id'], patch: AnnotationPatchDTO) => Promise<Annotation | null>;
}
