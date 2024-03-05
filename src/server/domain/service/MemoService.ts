import { compact, isEmpty, mapValues, uniq } from 'lodash-es';
import assert from 'assert';

import { buildIndex } from '@utils/collection.js';
import type {
  Memo,
  MemoDTO,
  ClientMemoQuery,
  MemoVO,
  MemoPatchDTO,
  Duration,
  ClientTreeFragmentQuery,
} from '@domain/model/memo.js';
import { EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';

export default class MemoService extends BaseService {
  public async create(memo: MemoDTO) {
    if (memo.parentId) {
      await this.assertAvailableIds([memo.parentId]);
    }

    if (memo.isPinned) {
      await this.assertValidPin(memo.parentId);
    }

    const newMemo = await this.repo.memos.create(memo);

    return { ...newMemo, isStar: false, childrenCount: 0 };
  }

  private async assertValidPin(parentId?: Memo['parentId']) {
    const memos = await this.repo.memos.findAll({ isPinned: true, parentId: parentId || null });
    const LIMIT = 10;

    assert(memos.length < LIMIT, `can not pin more than ${LIMIT} memos`);
  }

  public async updateOne(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.assertAvailableIds([id]);
    const memo = await this.repo.memos.findOneById(id);

    if (patch.isPinned) {
      await this.assertValidPin(memo!.parentId);
    }

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
    assert(!isEmpty(query), 'can not query all');
    assert(!(query.isPinned && query.limit), 'isPinned / pinned can not be together');

    if (query.after || query.before) {
      await this.assertAvailableIds(compact([query.after, query.before]));
    }

    let startTime = query.startTime;
    let endTime = query.endTime;

    if (query.before) {
      const beforeMemo = await this.repo.memos.findOneById(query.before);

      assert(beforeMemo);
      endTime = Math.min(beforeMemo.createdAt, query.endTime || Infinity);
    }

    if (query.after) {
      const afterMemo = await this.repo.memos.findOneById(query.after);

      assert(afterMemo);
      startTime = Math.max(afterMemo.createdAt, query.startTime || 0);
    }

    const memos = await this.repo.memos.findAll({
      startTime,
      endTime,
      isAvailable: true,
      limit: query.limit,
      parentId: query.parentId || null,
      isPinned: query.isPinned,
      orderBy: 'createdAt',
    });

    return await this.toVO(memos);
  }

  private async toVO(memos: Memo): Promise<MemoVO>;
  private async toVO(memos: Memo[]): Promise<MemoVO[]>;
  private async toVO(memos: Memo[] | Memo): Promise<MemoVO[] | MemoVO> {
    const _memos = Array.isArray(memos) ? memos : [memos];
    const ids = _memos.map(({ id }) => id);
    const stars = buildIndex(await this.repo.stars.findAll({ entityId: ids }), 'entityId');
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

  public readonly assertAvailableIds = async (ids: MemoVO['id'][]) => {
    const memos = await this.repo.memos.findAll({ id: ids, isAvailable: true });
    assert(memos.length === uniq(ids).length);
  };

  public async queryAvailableDates(duration: Duration) {
    return this.repo.memos.queryAvailableDates(duration);
  }

  public async queryFragment({ to: id, limit }: ClientTreeFragmentQuery) {
    await this.assertAvailableIds([id]);

    const memo = await this.repo.memos.findOneById(id);
    assert(memo);

    id = memo.parentId || id;

    const [after, before] = await Promise.all([
      this.query({ after: id, limit, isPinned: false }),
      this.query({ before: id, limit, isPinned: false }),
    ]);

    const allMemos = [...after, ...before];

    if (memo.parentId) {
      const [afterChildren, beforeChildren] = await Promise.all([
        this.query({ after: id, limit, isPinned: false, parentId: memo.parentId }),
        this.query({ before: id, limit, isPinned: false, parentId: memo.parentId }),
      ]);

      allMemos.push(...afterChildren, ...beforeChildren);
    }

    return allMemos;
  }
}
