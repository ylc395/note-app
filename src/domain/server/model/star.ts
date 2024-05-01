import { EntityId } from '@domain/shared/model/entity.js';
import type { StarVO } from '@domain/shared/model/star.js';

export * from '@domain/shared/model/star.js';

export type StarRecord = Pick<StarVO, 'entityId' | 'entityType' | 'icon'>;

export interface StarQuery {
  isAvailableOnly?: boolean;
  entityId?: EntityId[];
}
