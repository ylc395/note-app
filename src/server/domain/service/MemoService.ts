import { Injectable } from '@nestjs/common';

import type { MemoDTO, MemoPatchDTO, MemoQuery, MemoVO } from 'interface/Memo';

import BaseService from './BaseService';

@Injectable()
export default class MemoService extends BaseService {
  async create(memo: MemoDTO) {
    return await this.memos.create(memo);
  }

  async update(id: MemoVO['id'], patch: MemoPatchDTO) {
    const result = await this.memos.update(id, patch);

    if (!result) {
      throw new Error('wrong id');
    }

    return result;
  }

  async query(q: MemoQuery) {
    return await this.memos.findAll(q);
  }
}
