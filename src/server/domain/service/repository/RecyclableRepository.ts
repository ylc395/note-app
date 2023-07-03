import type { RecyclableRecord } from 'interface/recyclables';
import type { EntityLocator } from 'interface/entity';

export type DeletedRecord = EntityLocator & { deletedAt: number };

export interface RecyclablesRepository {
  create: (entities: EntityLocator[]) => Promise<RecyclableRecord[]>;
  findAllByLocators: (entities: EntityLocator[]) => Promise<RecyclableRecord[]>; // not including hard deleted record
  getHardDeletedRecord: (entity: EntityLocator) => Promise<DeletedRecord | null>;
}
