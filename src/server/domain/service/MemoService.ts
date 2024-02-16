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
    let pinnedMemos: Memo[] = [];

    if ('startTime' in query) {
      memos = await this.repo.memos.findAll({ ...query, orderBy: 'createdAt', isAvailable: true });
    } else {
      if (!query.before) {
        pinnedMemos = await this.repo.memos.findAll({ isPinned: true, orderBy: 'createdAt', isAvailable: true });
      }

      let endTime: number | undefined;
      let startTime: number | undefined;

      if (query.before) {
        const memo = await this.repo.memos.findOneById(query.before);
        assert(memo);

        endTime = memo.createdAt;
      }

      if (query.after) {
        const memo = await this.repo.memos.findOneById(query.after);
        assert(memo);

        startTime = memo.createdAt;
      }

      memos = await this.repo.memos.findAll({
        startTime,
        endTime,
        isAvailable: true,
        isPinned: false,
        limit: query.parentId ? undefined : query.limit,
        parentId: query.parentId || null,
        orderBy: 'createdAt',
      });
    }

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

  public readonly assertAvailableIds = async (ids: MemoVO['id'][], options?: { parentId?: EntityParentId }) => {
    const memos = await this.repo.memos.findAll({ id: ids, parentId: options?.parentId, isAvailable: true });
    assert(memos.length === uniq(ids).length);
  };

  public async queryAvailableDates(duration: Duration) {
    return this.repo.memos.queryAvailableDates(duration);
  }
}
