import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from 'infra/TransactionManager';

import { token as noteRepositoryToken, type NoteRepository } from 'service/repository/NoteRepository';
import {
  token as recyclablesRepositoryToken,
  type RecyclablesRepository,
} from 'service/repository/RecyclableRepository';

export enum RecyclablesTypes {
  Note = 1,
}

@Injectable()
export default class RecyclableService {
  constructor(
    @Inject(recyclablesRepositoryToken) private readonly recyclables: RecyclablesRepository,
    @Inject(noteRepositoryToken) private readonly notes: NoteRepository,
  ) {}

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
