import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';

import type { MemoDTO, MemoPatchDTO, MemoPaginationQuery, MemoVO, ParentMemoVO } from 'interface/memo';

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

    this.eventEmitter.emit(events.contentUpdated, {
      id: newMemo.id,
      type: EntityTypes.Memo,
      content: newMemo.content,
    } as MemoContentUpdatedEvent);

    return newMemo;
  }

  async update(id: ParentMemoVO['id'], patch: MemoPatchDTO) {
    if ((await this.memos.findParent(id)) && patch.isPinned) {
      throw new Error('can not pin child memo');
    }

    const updated = await this.memos.update(id, { ...patch, updatedAt: dayjs().unix() });

    if (!updated) {
      throw new Error('wrong id');
    }

    if (patch.content) {
      this.eventEmitter.emit(events.contentUpdated, {
        id,
        type: EntityTypes.Memo,
        content: patch.content,
      } as MemoContentUpdatedEvent);
    }

    return updated;
  }

  async query(q: MemoPaginationQuery) {
    return await this.memos.list(q);
  }
}
