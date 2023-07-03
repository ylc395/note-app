import type { StarRecord } from 'interface/star';
import type { EntityLocator } from 'interface/entity';

export interface StarRepository {
  create: (entities: EntityLocator[]) => Promise<StarRecord[]>;
  findAllByLocators: (entities?: EntityLocator[]) => Promise<StarRecord[]>;
  remove: (id: StarRecord['id']) => Promise<void>;
  findOneById: (id: StarRecord['id']) => Promise<StarRecord | null>;
}
