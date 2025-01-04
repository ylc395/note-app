import type { EntityId, EntityTypes } from '#domain/shared/model/entity';

export * from '#domain/shared/model/entity';

export interface EntityLocator {
  entityId: EntityId;
  entityType: EntityTypes;
  mimeType?: string;
}

export const entityLocatorTypeId = Symbol();
