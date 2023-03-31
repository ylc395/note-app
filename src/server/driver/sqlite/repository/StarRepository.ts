import { EntityTypes, type EntityId } from 'interface/entity';
import type { StarRecord } from 'interface/star';
import type { StarRepository, StarQuery } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import RecyclableRepository from './RecyclableRepository';
import schema, { type Row } from '../schema/star';
import noteSchema from '../schema/note';

export default class SqliteStarRepository extends BaseRepository<Row> implements StarRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: EntityId[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const starRows: Row[] = await this.knex<Row>(this.schema.tableName).insert(rows).returning(this.knex.raw('*'));

    return starRows.map((row) => ({ ...row, entityId: String(row.entityId), id: String(row.id) }));
  }

  async findAll(query?: StarQuery) {
    const noteTableName = noteSchema.tableName;
    const {
      knex,
      schema: { tableName: starTableName },
    } = this;

    const qb = this.knex(this.schema.tableName)
      .select(knex.raw(`${starTableName}.*`))
      .join(noteTableName, function () {
        this.on(`${starTableName}.entityType`, knex.raw(EntityTypes.Note));
        this.on(`${starTableName}.entityId`, `${noteTableName}.id`);
      });

    if (query) {
      for (const [k, v] of Object.entries(query)) {
        qb.andWhere(`${starTableName}.${k}`, Array.isArray(v) ? 'in' : '=', v);
      }
    }

    const starRows: Row[] = await RecyclableRepository.withoutRecyclables(
      qb,
      noteTableName,
      knex.raw(EntityTypes.Note),
    );

    return starRows.map((row) => ({ ...row, entityId: String(row.entityId), id: String(row.id) }));
  }

  async remove(id: StarRecord['id']) {
    await this.knex(this.schema.tableName).delete().where('id', id);
  }
}
