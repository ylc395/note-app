import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from 'infra/TransactionManager';
import type { NoteVO } from 'interface/Note';

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

  private async getDescendantsOfNotes(noteIds: NoteVO['id'][]) {
    const ids = [...noteIds];
    let notesToFind = noteIds;

    while (notesToFind.length > 0) {
      const rows = await this.notes.findAll({ parentId: notesToFind });

      notesToFind = rows.map(({ id }) => id);
      ids.push(...notesToFind);
    }

    return ids;
  }

  @Transaction
  async put(type: RecyclablesTypes, ids: string[]) {
    if (ids.length === 0) {
      return { count: 0 };
    }

    let isAvailable: boolean;
    let allIds = ids;

    switch (type) {
      case RecyclablesTypes.Note:
        allIds = await this.getDescendantsOfNotes(ids);
        isAvailable = await this.notes.isAvailable(allIds);
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
