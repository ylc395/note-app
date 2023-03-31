import { Injectable } from '@nestjs/common';

import { EntityId, EntityTypes } from 'interface/entity';
import { Transaction } from 'infra/Database';
import BaseService from './BaseService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Transaction
  async put(type: EntityTypes, ids: EntityId[]) {
    let isAvailable: boolean;
    let allIds: EntityId[];

    switch (type) {
      case EntityTypes.Note:
        allIds = [...ids, ...(await this.notes.findAllDescendantIds(ids))];
        isAvailable = await this.notes.areAvailable(allIds);
        break;
      default:
        throw new Error('unknown type');
    }

    if (!isAvailable) {
      throw new Error('entities not available');
    }

    return await this.recyclables.put(type, allIds);
  }
}
