import { mapValues, uniq } from 'lodash-es';

import { buildIndex } from '@utils/collection.js';
import type { Memo, MemoDTO, ClientMemoQuery, MemoVO, MemoPatchDTO, Duration } from '@domain/model/memo.js';
import { EntityParentId, EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import assert from 'assert';

export default class MemoService extends BaseService {
  public async create(memo: MemoDTO) {
    if (memo.parentId) {
      assert(!memo.isPinned, 'can not pin child memo');
      await this.assertAvailableIds([memo.parentId], { parentId: null });
    }

    const newMemo = await this.repo.memos.create(memo);
    return { ...newMemo, isStar: false, childrenCount: 0 };
  }

  public async updateOne(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.assertAvailableIds([id], { parentId: patch.isPinned ? null : undefined });

    const updated = await this.repo.memos.update(id, patch);
    assert(updated);

    if (typeof patch.body === 'string') {
      this.eventBus.emit('contentUpdated', {
        updatedAt: updated.updatedAt,
        content: patch.body,
        entityId: id,
        entityType: EntityTypes.Memo,
      });
    }

    return this.toVO(updated);
  }

  public async query(query: ClientMemoQuery) {
    let memos: Memo[] = [];

    if ('parentId' in query) {
      memos = await this.repo.memos.findAll({
        isAvailable: true,
        parentId: query.parentId,
        orderBy: 'createdAt',
      });

      return await this.toVO(memos);
    }

    let pinnedMemos: Memo[] = [];
    const noDuration = !query.startTime && !query.endTime;

    if (noDuration) {
      pinnedMemos = await this.repo.memos.findAll({
        isAvailable: true,
        isPinned: true,
        orderBy: 'createdAt',
      });
    }

    memos = await this.repo.memos.findAll({
      startTime: query.startTime,
      endTime: query.endTime,
      isAvailable: true,
      limit: query.limit,
      parentId: null,
      isPinned: noDuration ? false : undefined,
      orderBy: 'createdAt',
    });

    if (!noDuration) {
      memos.sort((memo1, memo2) => {
        if (memo1.isPinned !== memo2.isPinned) {
          return memo1.isPinned ? -1 : 1;
        }

        return memo2.createdAt - memo1.createdAt;
      });
    }

    return await this.toVO([...pinnedMemos, ...memos]);
  }

  private async toVO(memos: Memo): Promise<MemoVO>;
  private async toVO(memos: Memo[]): Promise<MemoVO[]>;
  private async toVO(memos: Memo[] | Memo): Promise<MemoVO[] | MemoVO> {
    const _memos = Array.isArray(memos) ? memos : [memos];
    const ids = _memos.map(({ id }) => id);
    const stars = buildIndex(await this.repo.stars.findAll({ entityId: ids }));
    const childrenIds = await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });

    const result = _memos.map((memo) => ({
      ...memo,
      childrenCount: childrenIds[memo.id]?.length || 0,
      isStar: Boolean(stars[memo.id]),
    }));

    return Array.isArray(memos) ? result : result[0]!;
  }

  public readonly getTitles = async (ids: MemoVO['id'][]) => {
    const memos = await this.repo.memos.findAll({ id: ids });
    return mapValues(buildIndex(memos), ({ body }) => body.slice(0, 5));
  };

  public readonly assertAvailableIds = async (ids: MemoVO['id'][], options?: { parentId?: EntityParentId }) => {
    const memos = await this.repo.memos.findAll({ id: ids, parentId: options?.parentId, isAvailable: true });
    assert(memos.length === uniq(ids).length);
  };

  public async queryAvailableDates(duration: Duration) {
    return this.repo.memos.queryAvailableDates(duration);
  }
}
