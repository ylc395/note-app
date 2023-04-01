import { Injectable } from '@nestjs/common';
import { Transaction } from 'infra/Database';

import type { MemoDTO, MemoPatchDTO, MemoQuery, MemoVO } from 'interface/memo';

import BaseService from './BaseService';

@Injectable()
export default class MemoService extends BaseService {
  @Transaction
  async create(memo: MemoDTO) {
    if (memo.parentId && memo.isPinned) {
      throw new Error('can not pin child memo');
    }

    return await this.memos.create(memo);
  }

  @Transaction
  async update(id: MemoVO['id'], patch: MemoPatchDTO) {
    if ((await this.memos.findParent(id)) && patch.isPinned) {
      throw new Error('can not pin child memo');
    }

    const updated = await this.memos.update(id, patch);

    if (!updated) {
      throw new Error('wrong id');
    }

    return updated;
  }

  async query(q: MemoQuery) {
    return await this.memos.list(q);
  }
}
