import type { StarRecord } from 'model/star';
import type { EntityLocator } from 'model/entity';

export interface StarRepository {
  batchCreate: (entities: EntityLocator[]) => Promise<StarRecord[]>;
  findAllByLocators: (entities?: EntityLocator[], filter?: { isAvailable?: boolean }) => Promise<StarRecord[]>;
  remove: (id: StarRecord['entityId']) => Promise<void>;
  findOneById: (id: StarRecord['entityId']) => Promise<StarRecord | null>;
}
