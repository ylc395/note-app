import type {
  NewAnnotationDTO,
  AnnotationPatchDTO,
  Annotation,
  NewMaterialDirectory,
  NewMaterialEntity,
  MaterialDirectory,
  Material,
  MaterialQuery,
  MaterialEntity,
  MaterialPatch,
} from 'model/material';

export interface MaterialRepository {
  createDirectory: (directory: NewMaterialDirectory) => Promise<MaterialDirectory>;
  createEntity: (material: NewMaterialEntity) => Promise<MaterialEntity>;
  update(id: Material['id'], material: MaterialPatch): Promise<Material | null>;
  update(id: Material['id'][], material: MaterialPatch): Promise<Material[]>;
  findAll: (query: MaterialQuery) => Promise<Material[]>;
  findChildrenIds: (
    ids: Material['id'][],
    filter?: { isAvailable?: boolean },
  ) => Promise<Record<Material['id'], Material['id'][]>>;
  findDescendantIds: (materialIds: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findAncestorIds: (materialIds: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findOneById: (id: Material['id']) => Promise<Material | null>;
  findBlobById: (id: Material['id']) => Promise<ArrayBuffer | null>;
  createAnnotation: (materialId: Material['id'], annotation: NewAnnotationDTO) => Promise<Annotation>;
  findAllAnnotations: (materialId: Material['id']) => Promise<Annotation[]>;
  removeAnnotation: (annotationId: Annotation['id']) => Promise<Annotation | null>;
  findAnnotationById: (annotationId: Annotation['id']) => Promise<Annotation | null>;
  updateAnnotation: (annotationId: Annotation['id'], patch: AnnotationPatchDTO) => Promise<Annotation | null>;
}
