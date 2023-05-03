import type { EntityId, EntityTypes } from './entity';

export interface SearchResultVO {
  title: string;
  snippet: string;
  entityType: EntityTypes;
  entityId: EntityId;
}
