import type { EntityId } from '@domain/model/entity';
import type { StarEntityLocator, StarRecord } from '@domain/model/star';

export interface StarRepository {
  batchCreate: (entities: StarEntityLocator[]) => Promise<StarRecord[]>;
  findAllByEntityId: (entityId: EntityId[]) => Promise<StarRecord[]>;
  findAllAvailable: () => Promise<StarRecord[]>;
  remove: (id: StarRecord['entityId']) => Promise<boolean>;
}
