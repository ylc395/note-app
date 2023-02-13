import { Injectable } from '@nestjs/common';
import { EntityTypes } from 'interface/Entity';

import { Transaction } from 'infra/Database';

import BaseService from './BaseService';

@Injectable()
export default class StarService extends BaseService {
  @Transaction
  async put(type: EntityTypes, ids: string[]) {
    if (ids.length === 0) {
      throw new Error('no ids');
    }

    let isAvailable: boolean;

    switch (type) {
      case EntityTypes.Note:
        isAvailable = await this.notes.areAvailable(ids);
        break;
      default:
        throw new Error('unknown type');
    }

    if (!isAvailable) {
      throw new Error('entities not available');
    }

    return await this.stars.put(type, ids);
  }

  async query() {
    return await this.stars.findAll();
  }
}
