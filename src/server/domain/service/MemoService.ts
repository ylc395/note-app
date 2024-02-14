import { mapValues, uniq } from 'lodash-es';

import { buildIndex } from '@utils/collection.js';
import type { Memo, MemoDTO, ClientMemoQuery, MemoVO, MemoPatchDTO, Duration } from '@domain/model/memo.js';
import { EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import assert from 'assert';

export default class MemoService extends BaseService {
  public async create(memo: MemoDTO) {
    if (memo.parentId) {
      assert(!memo.isPinned, 'can not pin child memo');
      await this.assertAvailableIds([memo.parentId], { isChild: false });
    }

    const newMemo = await this.repo.memos.create(memo);
    return { ...newMemo, isStar: false, childrenCount: 0 };
  }

  public async updateOne(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.assertAvailableIds([id], { isChild: patch.isPinned ? false : undefined });

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
    let startTime = query.startTime;
    let pinnedMemos: Memo[] = [];

    if (query.after) {
      await this.assertAvailableIds([query.after], { isChild: false });
      const memo = await this.repo.memos.findOneById(query.after);
      assert(memo);
      startTime = Math.max(memo.createdAt, query.startTime || 0);
    } else {
      pinnedMemos = await this.repo.memos.findAll({ isPinned: true, orderBy: 'createdAt' });
    }

    const memos = await this.repo.memos.findAll({
      startTime,
      isAvailable: true,
      endTime: query.endTime,
      limit: query.parentId ? undefined : query.limit,
      parentId: query.parentId || null,
      orderBy: query.parentId ? undefined : 'createdAt',
    });

    return await this.toVO([...pinnedMemos, ...memos]);
  }

  private async toVO(memos: Memo): Promise<MemoVO>;
  private async toVO(memos: Memo[]): Promise<MemoVO[]>;
  private async toVO(memos: Memo[] | Memo): Promise<MemoVO[] | MemoVO> {
    const _memos = Array.isArray(memos) ? memos : [memos];
    const ids = _memos.map(({ id }) => id);
    const stars = buildIndex(await this.repo.stars.findAllByEntityId(ids));
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

  public readonly assertAvailableIds = async (ids: MemoVO['id'][], options?: { isChild?: boolean }) => {
    const memos = await this.repo.memos.findAll({ id: ids, isAvailable: true });
    assert(memos.length === uniq(ids).length);

    if (typeof options?.isChild === 'boolean') {
      assert(memos.every((memo) => (options.isChild ? memo.parentId : !memo.parentId)));
    }
  };

  public async queryAvailableDates(duration: Duration) {
    return this.repo.memos.queryAvailableDates(duration);
  }
}
