import type { Link } from 'model/content';
import type { ContentRepository } from 'service/repository/ContentRepository';

import BaseRepository from './BaseRepository';
import linkSchema from '../schema/link';
import type { EntityLocator } from 'model/entity';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  async createLinks(links: Link[]) {
    await this._batchCreate(
      linkSchema.tableName,
      links.map(({ from, to }) => ({
        fromEntityId: from.id,
        fromEntityType: from.type,
        fromFragmentId: from.pos,
        toEntityId: to.id,
        toEntityType: to.type,
        toFragmentId: to.fragmentId,
      })),
    );
  }

  async removeLinks({ id, type }: EntityLocator, _type: 'from' | 'to') {
    await this.db
      .deleteFrom(linkSchema.tableName)
      .where((eb) =>
        eb.and(_type === 'to' ? { toEntityId: id, toEntityType: type } : { fromEntityId: id, fromEntityType: type }),
      )
      .execute();
  }
  async createTopics() {}
  async removeTopics(entity: EntityLocator) {
    entity;
  }
}
