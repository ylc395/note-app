import { Injectable } from '@nestjs/common';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';

import { buildIndex, getIds, getLocators } from 'utils/collection';
import type { Memo, MemoDTO, MemoPatchDTO, ClientMemoQuery, MemoVO } from 'model/memo';
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

    return {
      ...omit(newMemo, ['userUpdatedAt']),
      updatedAt: newMemo.userUpdatedAt,
      isStar: false,
    };
  }

  async update(id: MemoVO['id'], patch: MemoPatchDTO) {
    if (typeof patch.isPinned !== 'undefined' && (await this.memos.findParent(id))) {
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

    return this.toVOs(updated);
  }

  async getTree({ after, limit = 30 }: ClientMemoQuery) {
    let createdAfter = 0;

    if (after) {
      const memo = await this.memos.findOneById(after);

      if (!memo) {
        throw new Error('invalid memo');
      }

      createdAfter = memo.createdAt;
    }

    const memos = await this.memos.findAll({ createdAfter, limit, isAvailable: true });
    const descantIds = await this.memos.findDescendantIds(getIds(memos));
    const descantMemos = await this.memos.findAll({ id: Object.values(descantIds).flat(), isAvailable: true });

    return this.toVOs([...memos, ...descantMemos]);
  }

  private async toVOs(memos: Memo): Promise<MemoVO>;
  private async toVOs(memos: Memo[]): Promise<MemoVO[]>;
  private async toVOs(memos: Memo[] | Memo) {
    const stars = buildIndex(
      await this.stars.findAllByLocators(getLocators(Array.isArray(memos) ? memos : [memos], EntityTypes.Memo)),
      'entityId',
    );

    const toVO = (memo: Memo) => ({
      ...omit(memo, ['userUpdatedAt']),
      updatedAt: memo.userUpdatedAt,
      isStar: Boolean(stars[memo.id]),
    });

    return Array.isArray(memos) ? memos.map(toVO) : toVO(memos);
  }

  async getDigest(ids: MemoVO['id'][]) {
    const memos = await this.memos.findAll({ id: ids });
    return mapValues(buildIndex(memos), ({ content }) => content.slice(0, 5));
  }

  async assertAvailableIds(ids: MemoVO['id'][]) {
    if ((await this.memos.findAll({ id: ids, isAvailable: true })).length !== ids.length) {
      throw new Error('invalid id');
    }
  }
}
