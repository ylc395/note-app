import type { EntityLocator } from 'interface/entity';
import type { RevisionVO } from 'interface/revision';

export interface RevisionDTO {
  entityId: EntityLocator['id'];
  entityType: EntityLocator['type'];
  diff: string;
}

export interface RevisionRepository {
  create: (revision: RevisionDTO) => Promise<RevisionVO>;
  findLatest: (entity: EntityLocator) => Promise<RevisionVO | null>;
  findUtil: (revisionId: RevisionVO['id']) => Promise<RevisionVO[]>;
}
