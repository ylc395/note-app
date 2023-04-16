import type { EntityLocator } from 'interface/entity';
import type { RevisionTypes, RevisionVO } from 'interface/revision';

export interface RevisionDTO {
  entityId: EntityLocator['id'];
  entityType: EntityLocator['type'];
  diff: string;
  type: RevisionTypes;
}

export interface RevisionRepository {
  create: (revision: RevisionDTO) => Promise<Required<RevisionVO>>;
  findLatest: (entity: EntityLocator) => Promise<Required<RevisionVO> | null>;
}
