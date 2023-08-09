import { Injectable } from '@nestjs/common';

import type { MemoDTO, MemoPatchDTO, MemoPaginationQuery, ParentMemoVO, MemoVO } from 'model/memo';
import { Events } from 'model/events';

import BaseService from './BaseService';
import { EntityTypes } from 'model/entity';

@Injectable()
export default class MemoService extends BaseService {
  async create(memo: MemoDTO) {
    if (memo.parentId && memo.isPinned) {
      throw new Error('can not pin child memo');
    }

    const newMemo = await this.memos.create(memo);

    this.eventEmitter.emit(Events.ContentUpdated, {
      id: newMemo.id,
      type: EntityTypes.Memo,
      content: newMemo.content,
    });

    return newMemo;
  }

  async update(id: ParentMemoVO['id'], patch: MemoPatchDTO) {
    if ((await this.memos.findParent(id)) && patch.isPinned) {
      throw new Error('can not pin child memo');
    }

    const updated = await this.memos.update(id, patch);

    if (!updated) {
      throw new Error('wrong id');
    }

    if (patch.content) {
      this.eventEmitter.emit(Events.ContentUpdated, {
        id,
        type: EntityTypes.Memo,
        content: patch.content,
      });
    }

    return updated;
  }

  async query(q: MemoPaginationQuery) {
    return await this.memos.list(q);
  }

  async areAvailable(ids: MemoVO['id'][]) {
    const recyclables = await this.recyclables.findAllByLocators(ids.map((id) => ({ id, type: EntityTypes.Memo })));
    return recyclables.length === 0;
  }
}
