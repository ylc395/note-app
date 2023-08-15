import type {
  AnnotationDTO,
  AnnotationPatchDTO,
  AnnotationVO,
  MaterialDTO,
  Directory,
  Material,
  MaterialQuery,
  EntityMaterial,
} from 'model/material';

export interface MaterialRepository {
  createDirectory: (directory: MaterialDTO) => Promise<Directory>;
  createEntity: (material: MaterialDTO) => Promise<EntityMaterial>;
  findAll: (query: MaterialQuery) => Promise<Material[]>;
  findChildrenIds: (ids: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findDescendantIds: (materialIds: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findAncestorIds: (materialIds: Material['id']) => Promise<Material['id'][]>;
  findOneById: (id: Material['id']) => Promise<Material | null>;
  findBlobById: (id: Material['id']) => Promise<ArrayBuffer | null>;
  createAnnotation: (materialId: Material['id'], annotation: AnnotationDTO) => Promise<AnnotationVO>;
  findAllAnnotations: (materialId: Material['id']) => Promise<AnnotationVO[]>;
  removeAnnotation: (annotationId: AnnotationVO['id']) => Promise<boolean>;
  findAnnotationById: (annotationId: AnnotationVO['id']) => Promise<Required<AnnotationVO> | null>;
  updateAnnotation: (annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) => Promise<AnnotationVO | null>;
}
