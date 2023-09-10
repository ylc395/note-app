import type { StarRecord } from 'model/star';
import type { EntityLocator } from 'model/entity';

export interface StarRepository {
  batchCreate: (entities: EntityLocator[]) => Promise<StarRecord[]>;
  findAllByLocators: (entities?: EntityLocator[], filter?: { isAvailable?: boolean }) => Promise<StarRecord[]>;
  remove: (id: StarRecord['id']) => Promise<void>;
  findOneById: (id: StarRecord['id']) => Promise<StarRecord | null>;
}
