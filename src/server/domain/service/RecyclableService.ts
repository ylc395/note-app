import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import differenceWith from 'lodash/differenceWith';

import type { EntitiesLocator } from 'model/entity';
import { RecycleReason } from 'model/recyclables';
import { getLocators } from 'utils/collection';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create({ type, ids }: EntitiesLocator) {
    await this.entityService.assertAvailableEntities({ type, ids });
    const descants = await this.entityService.getDescants({ type, ids });
    const recyclables = await this.recyclables.findAllByLocators(getLocators([...ids, ...descants], type));

    const newRecyclables = differenceWith(
      [
        ...ids.map((id) => ({ id, type, reason: RecycleReason.Direct })),
        ...descants.map((id) => ({ id, type, reason: RecycleReason.Cascade })),
      ],
      recyclables,
      ({ type, id }, { entityId, entityType }) => id === entityId && type === entityType,
    );

    const result = await this.recyclables.batchCreate(newRecyclables);
    const directResult = result.filter((record) => record.reason === RecycleReason.Direct);
    const titles = await this.entityService.getEntityTitles(directResult);

    return directResult.map((record) => {
      const title = titles[record.entityType][record.entityId];

      if (!title) {
        throw new Error('no title');
      }

      return {
        ...omit(record, ['reason']),
        title,
      };
    });
  }

  async query() {
    const records = await this.recyclables.findAll(RecycleReason.Direct);
    const titles = await this.entityService.getEntityTitles(records);

    return records.map((record) => {
      const title = titles[record.entityType][record.entityId];

      if (!title) {
        throw new Error('no title');
      }

      return { ...record, title };
    });
  }
}
