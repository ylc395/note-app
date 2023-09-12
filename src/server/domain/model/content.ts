import type { EntityId, EntityTypes } from 'model/entity';

export interface ContentUpdate {
  id: EntityId;
  type: EntityTypes;
  content: string;
}
