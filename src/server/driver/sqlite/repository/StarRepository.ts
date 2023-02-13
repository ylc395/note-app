import { EntityTypes } from 'interface/Entity';
import type { StarRepository } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import RecyclableRepository from './RecyclableRepository';
import schema, { type Row } from '../schema/starSchema';
import noteSchema from '../schema/noteSchema';

export default class SqliteStarRepository extends BaseRepository<Row> implements StarRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: string[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const starRows: Row[] = await this.knex<Row>(this.schema.tableName).insert(rows).returning(this.knex.raw('*'));

    return starRows.map((row) => ({ ...row, entityId: String(row.entityId) }));
  }

  async findAll() {
    const noteTableName = noteSchema.tableName;
    const {
      knex,
      schema: { tableName: starTableName },
    } = this;

    const starRows = await RecyclableRepository.withoutRecyclables(this.knex, noteTableName, EntityTypes.Note)
      .select(knex.raw(`${starTableName}.*`), `${noteTableName}.title`)
      .from(this.schema.tableName)
      .leftJoin(noteTableName, function () {
        this.on(`${starTableName}.entityType`, knex.raw(EntityTypes.Note));
        this.on(`${starTableName}.entityId`, `${noteTableName}.id`);
      });

    return starRows.map((row) => ({ ...row, entityId: String(row.entityId) }));
  }
}
