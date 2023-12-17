import type { Material, NewAnnotationDTO, Annotation, AnnotationPatchDTO } from '@domain/model/material.js';

export interface MaterialAnnotationRepository {
  create: (materialId: Material['id'], annotation: NewAnnotationDTO) => Promise<Annotation>;
  findAll: (materialId: Material['id']) => Promise<Annotation[]>;
  remove: (annotationId: Annotation['id']) => Promise<Annotation | null>;
  findOneById: (annotationId: Annotation['id']) => Promise<Annotation | null>;
  update: (annotationId: Annotation['id'], patch: AnnotationPatchDTO) => Promise<Annotation | null>;
}
