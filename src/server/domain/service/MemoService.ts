import { mapValues, uniq } from 'lodash-es';

import { buildIndex } from '@utils/collection.js';
import type { Memo, MemoDTO, ClientMemoQuery, MemoVO, MemoPatchDTO, Duration } from '@domain/model/memo.js';
import { EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import assert from 'assert';

export default class MemoService extends BaseService {
  public async create(memo: MemoDTO) {
    assert(!(memo.parentId && memo.isPinned), 'can not pin child memo');
    const newMemo = await this.repo.memos.create(memo);

    return { ...newMemo, isStar: false };
  }

  public async updateOne(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.assertAvailableIds([id]);

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

    if (query.after) {
      await this.assertAvailableIds([query.after]);
      const memo = await this.repo.memos.findOneById(query.after);
      assert(memo);
      startTime = memo.createdAt;
    }

    const memos = await this.repo.memos.findAll({
      startTime,
      isAvailable: true,
      endTime: query.endTime,
      limit: query.parentId ? undefined : query.limit,
      parentId: query.parentId || null,
      orderBy: query.parentId ? undefined : 'createdAt',
    });

    return await this.toVO(memos);
  }

  private async toVO(memos: Memo): Promise<MemoVO>;
  private async toVO(memos: Memo[]): Promise<MemoVO[]>;
  private async toVO(memos: Memo[] | Memo): Promise<MemoVO[] | MemoVO> {
    const _memos = Array.isArray(memos) ? memos : [memos];

    assert(_memos.length > 0);
    const ids = _memos.map(({ id }) => id);
    const stars = buildIndex(await this.repo.stars.findAllByEntityId(ids));

    const result = _memos.map((memo) => ({
      ...memo,
      isStar: Boolean(stars[memo.id]),
    }));

    return Array.isArray(memos) ? result : result[0]!;
  }

  public readonly getTitles = async (ids: MemoVO['id'][]) => {
    const memos = await this.repo.memos.findAll({ id: ids });
    return mapValues(buildIndex(memos), ({ body }) => body.slice(0, 5));
  };

  public readonly assertAvailableIds = async (ids: MemoVO['id'][]) => {
    const memos = await this.repo.memos.findAll({ id: ids, isAvailable: true });
    assert(memos.length === uniq(ids).length);
  };

  public async queryAvailableDates(duration: Duration) {
    return this.repo.memos.queryAvailableDates(duration);
  }
}
