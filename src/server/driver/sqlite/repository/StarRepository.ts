import { EntityTypes, type EntityId } from 'interface/entity';
import type { StarRecord } from 'interface/star';
import type { StarRepository, StarQuery } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/star';
import noteSchema from '../schema/note';

export default class SqliteStarRepository extends BaseRepository<Row> implements StarRepository {
  protected readonly schema = schema;

  async put(entityType: EntityTypes, ids: EntityId[]) {
    const rows = ids.map((entityId) => ({ entityId, entityType }));
    const starRows = await this._batchCreate(rows);

    return starRows.map((row) => ({ ...row, entityId: String(row.entityId), id: String(row.id) }));
  }

  async findAll(query?: StarQuery) {
    const noteTableName = noteSchema.tableName;
    const {
      schema: { tableName: starTableName },
    } = this;

    const qb = this.db
      .selectFrom(this.schema.tableName)
      .innerJoin(noteTableName, (join) =>
        join
          .on(`${starTableName}.entityType`, '=', EntityTypes.Note)
          .onRef(`${starTableName}.entityId`, '=', `${noteTableName}.id`),
      );

    if (query) {
      for (const [k, v] of Object.entries(query)) {
        qb.where(`${starTableName}.${k as keyof StarQuery}`, Array.isArray(v) ? 'in' : '=', v);
      }
    }

    return await qb.selectAll().execute();
  }

  async remove(id: StarRecord['id']) {
    await this.db.deleteFrom(this.schema.tableName).where('id', '=', id).execute();
  }
}
