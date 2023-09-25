import { Injectable, Inject, forwardRef } from '@nestjs/common';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';

import { buildIndex, getIds, getLocators } from 'utils/collection';
import type { Memo, NewMemo, MemoPatch, ClientMemoQuery, MemoVO } from 'model/memo';
import { EntityTypes } from 'model/entity';

import BaseService from './BaseService';
import ContentService from './ContentService';
import StarService from './StarService';

@Injectable()
export default class MemoService extends BaseService {
  @Inject(forwardRef(() => ContentService)) private readonly contentService!: ContentService;
  @Inject(forwardRef(() => StarService)) private readonly starService!: StarService;

  async create(memo: NewMemo) {
    if (memo.parentId && memo.isPinned) {
      throw new Error('can not pin child memo');
    }

    const newMemo = await this.repo.memos.create(memo);

    return {
      ...omit(newMemo, ['userUpdatedAt']),
      updatedAt: newMemo.userUpdatedAt,
      isStar: false,
    };
  }

  async update(id: MemoVO['id'], patch: MemoPatch) {
    if (typeof patch.isPinned !== 'undefined' && (await this.repo.memos.findParent(id))) {
      throw new Error('can not pin child memo');
    }

    const updated = await this.repo.memos.update(id, patch);

    if (!updated) {
      throw new Error('wrong id');
    }

    if (typeof patch.content === 'string') {
      this.contentService.processContent({ content: patch.content, id, type: EntityTypes.Memo });
    }

    return this.toVOs(updated);
  }

  async getTree({ after, createdAfter, createdBefore, limit = 30 }: ClientMemoQuery) {
    let _createdAfter = createdAfter || 0;

    if (after) {
      const memo = await this.repo.memos.findOneById(after);

      if (!memo) {
        throw new Error('invalid memo');
      }

      _createdAfter = memo.createdAt;
    }

    const memos = await this.repo.memos.findAll({
      createdAfter: _createdAfter,
      createdBefore,
      limit,
      isAvailable: true,
      parentId: null,
      orderBy: 'createdAt',
    });

    const descantIds = await this.repo.memos.findDescendantIds(getIds(memos));
    const descantMemos = await this.repo.memos.findAll({ id: Object.values(descantIds).flat(), isAvailable: true });

    return this.toVOs([...memos, ...descantMemos]);
  }

  private async toVOs(memos: Memo): Promise<MemoVO>;
  private async toVOs(memos: Memo[]): Promise<MemoVO[]>;
  private async toVOs(memos: Memo[] | Memo) {
    const stars = await this.starService.getStarMap(
      getLocators(Array.isArray(memos) ? memos : [memos], EntityTypes.Memo),
    );

    const toVO = (memo: Memo) => ({
      ...omit(memo, ['userUpdatedAt']),
      updatedAt: memo.userUpdatedAt,
      isStar: Boolean(stars[memo.id]),
    });

    return Array.isArray(memos) ? memos.map(toVO) : toVO(memos);
  }

  async getTitles(ids: MemoVO['id'][]) {
    const memos = await this.repo.memos.findAll({ id: ids });
    return mapValues(buildIndex(memos), ({ content }) => content.slice(0, 5));
  }

  async assertAvailableIds(ids: MemoVO['id'][]) {
    if ((await this.repo.memos.findAll({ id: ids, isAvailable: true })).length !== ids.length) {
      throw new Error('invalid id');
    }
  }

  async queryDates() {
    return await this.repo.memos.queryAvailableDates();
  }
}
