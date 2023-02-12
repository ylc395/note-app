import { Injectable } from '@nestjs/common';

import { EntityTypes } from 'interface/Entity';
import { Transaction } from 'infra/Database';
import BaseService from './BaseService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Transaction
  async put(type: EntityTypes, ids: string[]) {
    let isAvailable: boolean;
    let allIds: string[];

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
