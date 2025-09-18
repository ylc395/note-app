import type { EntityId } from '#domain/shared/model/entity';
import type { TextLocation } from './content';

export * from '#domain/shared/model/topic';

export interface TopicRecord {
  entityId: EntityId;
  name: string;
  location: TextLocation;
}
