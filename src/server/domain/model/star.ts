import { EntityId } from '@domain/model/entity.js';
import type { StarVO } from '@shared/domain/model/star.js';

export * from '@shared/domain/model/star.js';

export type StarRecord = Pick<StarVO, 'entityId' | 'entityType' | 'icon'>;

export interface StarQuery {
  isAvailableOnly?: boolean;
  entityId?: EntityId[];
}
