import type { Revision, RevisionPatchDTO } from '#domain/shared/model/revision.js';
import type { Entity, EntityId } from '#domain/shared/model/entity.js';

export interface Query {
  entityIds?: EntityId[];
  ids?: Revision['id'][];
  isAvailableOnly?: boolean;
}

export interface EntitiesParams {
  isAvailableOnly?: boolean;
  before: number;
}

export interface RevisionRepository {
  findAll: (params: Query) => Promise<Revision[]>;
  batchCreate: (revisions: Revision[]) => Promise<void>;
  updateOne: (id: Revision['id'], patch: RevisionPatchDTO) => Promise<boolean>;
  findEntitiesWithoutRevisionBefore: (params: EntitiesParams) => Promise<Entity[]>;
}
