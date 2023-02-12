import { Injectable, Inject } from '@nestjs/common';
import { EntityTypes } from 'model/Entity';

import { Transaction, token as databaseToken, type Database } from 'infra/Database';

import type Repositories from './repository';

@Injectable()
export default class RecyclableService {
  private readonly recyclables: Repositories['recyclables'];
  private readonly notes: Repositories['notes'];

  constructor(@Inject(databaseToken) db: Database) {
    this.recyclables = db.getRepository('recyclables');
    this.notes = db.getRepository('notes');
  }

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
