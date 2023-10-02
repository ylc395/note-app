import type { EntityLocator } from 'model/entity';
import type { StarEntityLocator, StarRecord } from 'model/star';

export interface StarRepository {
  batchCreate: (entities: StarEntityLocator[]) => Promise<StarRecord[]>;
  findAllByLocators: (entities?: EntityLocator[], filter?: { isAvailable?: boolean }) => Promise<StarRecord[]>;
  remove: (id: StarRecord['entityId']) => Promise<void>;
  findOneById: (id: StarRecord['entityId']) => Promise<StarRecord | null>;
}
