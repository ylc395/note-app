import { Injectable } from '@nestjs/common';
import { Transaction } from 'infra/Database';

import type { MemoDTO, MemoPatchDTO, MemoQuery, MemoVO, ParentMemoVO } from 'interface/memo';

import BaseService from './BaseService';
import { EntityTypes } from 'interface/entity';

export const events = {
  contentUpdated: 'updated.content.memo',
};

export interface MemoContentUpdatedEvent {
  id: MemoVO['id'];
  type: EntityTypes.Memo;
  content: MemoVO['content'];
}
@Injectable()
export default class MemoService extends BaseService {
  async create(memo: MemoDTO) {
    if (memo.parentId && memo.isPinned) {
      throw new Error('can not pin child memo');
    }

    const newMemo = await this.memos.create(memo);
    await this.eventEmitter.emitAsync(events.contentUpdated, {
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
      await this.eventEmitter.emitAsync(events.contentUpdated, {
        id,
        type: EntityTypes.Memo,
        content: patch.content,
      } satisfies MemoContentUpdatedEvent);
    }

    return updated;
  }

  async query(q: MemoQuery) {
    return await this.memos.list(q);
  }
}
