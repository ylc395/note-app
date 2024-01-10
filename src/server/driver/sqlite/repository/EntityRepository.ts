import type { EntityId } from '@domain/model/entity.js';
import type { EntityRepository } from '@domain/service/repository/EntityRepository.js';

import HierarchyEntityRepository from './HierarchyEntityRepository.js';
import { tableName } from '../schema/entity.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteEntityRepository extends HierarchyEntityRepository implements EntityRepository {
  public readonly tableName = tableName;

  public async findAllAvailable(ids: EntityId[]) {
    const rows = await this.db
      .selectFrom(this.tableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .where(`${this.tableName}.id`, 'in', ids)
      .select([`${this.tableName}.id`])
      .execute();

    return rows.map(({ id }) => id);
  }

  public async *findAllBody(entities: EntityId[]) {
    const stream = this.db.selectFrom(this.tableName).select(['id', 'content']).where('id', 'in', entities).stream();

    for await (const row of stream) {
      yield row;
    }
  }
}
