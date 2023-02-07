import { Injectable, Inject } from '@nestjs/common';
import { Transaction, token as databaseToken, type Database } from 'infra/Database';

import type Repositories from './repository';

export enum RecyclablesTypes {
  Note = 1,
}

@Injectable()
export default class RecyclableService {
  private readonly recyclables: Repositories['recyclables'];
  private readonly notes: Repositories['notes'];

  constructor(@Inject(databaseToken) db: Database) {
    this.recyclables = db.getRepository('recyclables');
    this.notes = db.getRepository('notes');
  }

  @Transaction
  async put(type: RecyclablesTypes, ids: string[]) {
    if (ids.length === 0) {
      return { count: 0 };
    }

    let isAvailable: boolean;
    let allIds: string[];

    switch (type) {
      case RecyclablesTypes.Note:
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
