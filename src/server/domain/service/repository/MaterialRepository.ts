import type {
  AnnotationDTO,
  AnnotationPatchDTO,
  AnnotationVO,
  DirectoryVO,
  EntityMaterialVO,
  MaterialDTO,
  MaterialVO,
  Directory,
  MaterialQuery,
} from 'model/material';

export interface MaterialRepository {
  createDirectory: (directory: Directory) => Promise<DirectoryVO>;
  createEntity: (material: MaterialDTO) => Promise<EntityMaterialVO>;
  findAll: (query: MaterialQuery) => Promise<MaterialVO[]>;
  findAllDescendantIds: (noteIds: MaterialVO['id'][]) => Promise<Record<MaterialVO['id'], MaterialVO['id'][]>>;
  findOneById: (id: MaterialVO['id']) => Promise<MaterialVO | null>;
  findBlobById: (id: MaterialVO['id']) => Promise<ArrayBuffer | string | null>;
  createAnnotation: (materialId: MaterialVO['id'], annotation: AnnotationDTO) => Promise<AnnotationVO>;
  findAllAnnotations: (materialId: MaterialVO['id']) => Promise<AnnotationVO[]>;
  updateText: <T>(materialId: MaterialVO['id'], payload: T) => Promise<T | null>;
  removeAnnotation: (annotationId: AnnotationVO['id']) => Promise<boolean>;
  findAnnotationById: (annotationId: AnnotationVO['id']) => Promise<Required<AnnotationVO> | null>;
  updateAnnotation: (annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) => Promise<AnnotationVO | null>;
}
