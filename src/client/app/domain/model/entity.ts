import type { EntityLocator as Entity, EntityTypes } from 'shared/model/entity';

export * from 'shared/model/entity';

export interface EntityLocator extends Entity {
  mimeType?: string;
}

export type EditableEntityTypes = EntityTypes.Note | EntityTypes.Material;

export interface EditableEntityLocator extends EntityLocator {
  entityType: EditableEntityTypes;
}
