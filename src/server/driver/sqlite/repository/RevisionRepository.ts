import type { RevisionDTO, RevisionRepository } from 'service/repository/RevisionRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/revision';
import { RevisionTypes } from 'interface/revision';
import type { EntityLocator } from 'interface/entity';

export default class SqliteRevisionRepository extends BaseRepository<Row> implements RevisionRepository {
  protected readonly schema = schema;
  async create(revision: RevisionDTO) {
    return {
      id: '',
      createdAt: 1,
      type: RevisionTypes.Regular,
    };
  }

  async findLatest(entity: EntityLocator) {
    return null;
  }
}
