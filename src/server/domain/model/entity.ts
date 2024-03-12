import type { EntityId } from '@domain/model/entity.js';

export * from '@shared/domain/model/entity.js';

export interface Entity {
  entityId: EntityId;
  createdAt: number;
  updatedAt: number;
  content: string;
}
