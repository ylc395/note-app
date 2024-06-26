export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
  Annotation,
}

export interface Entity {
  id: EntityId;
  title: string;
  type: EntityTypes;
  icon: string | null;
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export type WithId<T extends { id: EntityId }> = Partial<T> & Pick<T, 'id'>;

export type EntityId = string;

export type EntityParentId = EntityId | null;

export interface HierarchyEntity {
  id: EntityId;
  parentId: EntityParentId;
  childrenCount: number;
}

export interface EntityLocator {
  entityId: EntityId;
  entityType: EntityTypes;
}

export type Path = { id: EntityId; title: string; icon: string | null }[];
