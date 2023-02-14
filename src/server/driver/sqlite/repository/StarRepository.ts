import { EntityTypes } from 'interface/Entity';
import type { StarRepository } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import RecyclableRepository from './RecyclableRepository';
import schema, { type Row } from '../schema/starSchema';
import noteSchema from '../schema/noteSchema';
import type { StarRecord } from 'interface/Star';

export default class SqliteStarRepository extends BaseRepository<Row> implements StarRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: string[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const starRows: Row[] = await this.knex<Row>(this.schema.tableName).insert(rows).returning(this.knex.raw('*'));

    return starRows.map((row) => ({ ...row, entityId: String(row.entityId), id: String(row.id) }));
  }

  async findAll() {
    const noteTableName = noteSchema.tableName;
    const {
      knex,
      schema: { tableName: starTableName },
    } = this;

    const query = this.knex(this.schema.tableName)
      .select(knex.raw(`${starTableName}.*`))
      .join(noteTableName, function () {
        this.on(`${starTableName}.entityType`, knex.raw(EntityTypes.Note));
        this.on(`${starTableName}.entityId`, `${noteTableName}.id`);
      });
    const starRows: Row[] = await RecyclableRepository.withoutRecyclables(
      query,
      noteTableName,
      knex.raw(EntityTypes.Note),
    );

    return starRows.map((row) => ({ ...row, entityId: String(row.entityId), id: String(row.id) }));
  }

  async remove(id: StarRecord['id']) {
    await this.knex(this.schema.tableName).delete().where('id', id);
  }
}
