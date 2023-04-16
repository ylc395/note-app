import type { EntityLocator } from 'interface/entity';
import type { RevisionTypes, RevisionVO } from 'interface/revision';

export interface RevisionRepository {
  create: (revision: {
    entityId: EntityLocator['id'];
    entityType: EntityLocator['type'];
    diff: string;
    type: RevisionTypes;
  }) => Promise<RevisionVO>;
  findLatest: (entity: EntityLocator) => Promise<Required<RevisionVO> | null>;
}
