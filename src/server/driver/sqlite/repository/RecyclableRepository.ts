import zipObject from 'lodash/zipObject';
import differenceWith from 'lodash/differenceWith';
import isEqual from 'lodash/isEqual';

import type { EntityLocator, EntityTypes } from 'interface/entity';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';
import { buildIndex } from 'utils/collection';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/recyclable';

export default class SqliteRecyclableRepository extends BaseRepository<Row> implements RecyclablesRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: string[]) {
    const newRows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const rows = await this.knex<Row>(this.schema.tableName)
      .whereIn('entityId', ids)
      .andWhere('entityType', type)
      .select('entityId', 'entityType');

    const recyclablesRows: Row[] = await this.knex<Row>(this.schema.tableName)
      .insert(differenceWith(newRows, rows, isEqual))
      .returning(this.knex.raw('*'));

    return recyclablesRows.map((row) => ({ ...row, entityId: String(row.entityId) }));
  }

  async isRecyclable({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.knex<Row>(this.schema.tableName)
      .where({ entityId: Number(entityId), entityType })
      .first();
    return Boolean(row);
  }

  async areRecyclable(type: EntityTypes, ids: EntityLocator['id'][]) {
    if (ids.length === 0) {
      return {};
    }

    const rows = await this.knex<Row>(this.schema.tableName).whereIn('entityId', ids).andWhere('entityType', type);
    const index = buildIndex(rows, 'entityId');

    return zipObject(
      ids,
      ids.map((id) => Boolean(index[id])),
    );
  }
}
