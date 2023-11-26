import type { EntityId } from 'model/entity';
import type { StarEntityLocator, StarRecord } from 'model/star';

export interface StarRepository {
  batchCreate: (entities: StarEntityLocator[]) => Promise<StarRecord[]>;
  findAllByEntityId: (entityId: EntityId[]) => Promise<StarRecord[]>;
  findAllAvailable: () => Promise<StarRecord[]>;
  remove: (id: StarRecord['entityId']) => Promise<boolean>;
}
