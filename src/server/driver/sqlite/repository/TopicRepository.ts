import type { EntityId } from '@domain/model/entity.js';
import type { TopicRepository, Topics } from '@domain/service/repository/TopicRepository.js';

import BaseRepository from './BaseRepository.js';
import { tableName as topicTableName } from '../schema/topic.js';
import { tableName as entityTableName } from '../schema/entity.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteTopicRepository extends BaseRepository implements TopicRepository {
  public async removeTopics(entityId: EntityId, names: string[]) {
    await this.db.deleteFrom(topicTableName).where('entityId', '=', entityId).where('name', 'in', names).execute();
  }

  public async createTopics(entityId: EntityId, { names, createdAt }: Topics) {
    await this.batchCreateOn(
      topicTableName,
      names.map((name) => ({ name, entityId, createdAt })),
    );
  }

  public findTopicsOf(id: EntityId) {
    return this.db.selectFrom(topicTableName).selectAll().where('entityId', '=', id).execute();
  }

  async findAllAvailableTopics() {
    const rows = await this.db
      .selectFrom(topicTableName)
      .innerJoin(entityTableName, `${entityTableName}.id`, `${topicTableName}.entityId`)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${topicTableName}.entityId`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .selectAll(topicTableName)
      .select(['type as entityType'])
      .execute();

    return rows;
  }
}
