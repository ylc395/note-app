import type { AnnotationPatchDTO, Annotation } from '@domain/shared/model/annotation.js';

export type AnnotationPatch = AnnotationPatchDTO & Pick<Annotation, 'updatedAt'>;

export * from '@domain/shared/model/annotation.js';
