import { Injectable } from '@nestjs/common';
import mapValues from 'lodash/mapValues';

import { buildIndex } from 'utils/collection';
import type { MemoDTO, MemoPatchDTO, ParentMemoVO, MemoVO } from 'model/memo';
import { EntityTypes } from 'model/entity';
import { Events } from 'model/events';

import BaseService from './BaseService';

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

  async query() {
    return await this.memos.findAll();
  }

  async getDigest(ids: MemoVO['id'][]) {
    const memos = await this.memos.findAll({ id: ids });
    return mapValues(buildIndex(memos), ({ content }) => content.slice(0, 5));
  }

  async assertAvailableIds(ids: MemoVO['id'][]) {
    const recyclables = await this.recyclables.findAllByLocators(ids.map((id) => ({ id, type: EntityTypes.Memo })));

    if (recyclables.length > 0) {
      throw new Error('invalid id');
    }
  }
}
