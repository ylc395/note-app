import { groupBy, mapValues, size } from 'lodash-es';
import assert from 'assert';
import { singleton } from 'tsyringe';
import dayjs from 'dayjs';

import { arrayOf, buildIndex } from '@utils/collection.js';
import {
  type Memo,
  type MemoDTO,
  type ClientMemoQuery,
  type MemoVO,
  type MemoPatchDTO,
  type Duration,
  isDuration,
} from '@domain/server/model/memo.js';
import { EntityTypes } from '@domain/shared/model/entity.js';
import { EventNames } from '@domain/server/model/content.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class MemoService extends BaseService {
  @BaseService.transaction()
  public async create(memo: MemoDTO) {
    if (memo.parentId) {
      assert(typeof memo.isPinned === 'undefined', 'can not pin/unpin a child memo');
      await this.assertAvailableId(memo.parentId);
    }

    if (memo.isPinned) {
      await this.assertCanPin();
    }

    const now = Date.now();

    const latest = await this.repo.memos.findLatest();
    const newMemo = await this.repo.memos.create({
      id: EntityService.generateId(),
      updatedAt: now,
      createdAt: now,
      index: latest?.index || 1,
      parentId: memo.parentId || null,
      isPinned: memo.isPinned || false,
      body: memo.body,
    });

    return this.toVO(newMemo, true);
  }

  @BaseService.transaction()
  public async updateOne(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.assertAvailableId(id, { isPinned: typeof patch.isPinned === 'boolean' ? !patch.isPinned : undefined });

    if (patch.isPinned) {
      await this.assertCanPin();
    }

    const hasContentUpdated = typeof patch.body === 'string';
    const now = Date.now();

    await this.repo.memos.update(id, {
      ...patch,
      updatedAt: hasContentUpdated ? now : undefined,
    });

    if (hasContentUpdated) {
      this.eventBus.emit(EventNames.ContentUpdated, {
        updatedAt: now,
        body: patch.body,
        entityType: EntityTypes.Memo,
        entityId: id,
      });
    }
  }

  @BaseService.transaction()
  public async queryList(query: ClientMemoQuery) {
    let memos: Memo[];

    if (isDuration(query)) {
      memos = await this.repo.memos.findAll({ ...query, isAvailableOnly: true, orderBy: 'index', order: 'desc' });
    } else {
      assert(!(query.before && query.beforeIncludes), 'before and beforeIncludes can not be used together');
      assert(!(query.after && query.afterIncludes), 'after and afterIncludes can not be used together');

      const beforeId = query.before || query.beforeIncludes;
      const afterId = query.after || query.afterIncludes;

      if (beforeId) {
        const beforeMemo = await this.repo.memos.findOneById(beforeId);
        assert(beforeMemo);
      }

      if (afterId) {
        const afterMemo = await this.repo.memos.findOneById(afterId);
        assert(afterMemo);
      }

      memos = await this.repo.memos.findAll({
        isAvailableOnly: true,
        limit: query.limit,
        parentId: query.parentId || null,
        isPinned: query.isPinned,
        order: 'desc',
        orderBy: 'index',
      });
    }

    return await this.toVO(memos);
  }

  @BaseService.transaction()
  public async queryAvailableDates(duration: Duration) {
    const memos = await this.repo.memos.findAvailableBetween(duration);

    return mapValues(
      groupBy(memos, (memo) => dayjs(memo.createdAt).startOf('day')),
      size,
    );
  }

  private async toVO(memos: Memo, isNew?: boolean): Promise<MemoVO>;
  private async toVO(memos: Memo[]): Promise<MemoVO[]>;
  private async toVO(memos: Memo[] | Memo, isNew?: boolean): Promise<MemoVO[] | MemoVO> {
    const _memos = arrayOf(memos);
    const ids = _memos.map(({ id }) => id);
    const stars = isNew ? {} : buildIndex(await this.repo.stars.findAll({ entityIds: ids }), 'entityId');
    const childrenIds = isNew ? {} : await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });

    const result = _memos.map((memo) => ({
      ...memo,
      childrenCount: childrenIds[memo.id]?.length || 0,
      referrers: [],
      isStar: Boolean(stars[memo.id]),
    }));

    return Array.isArray(memos) ? result : result[0]!;
  }

  private readonly assertAvailableId = async (id: MemoVO['id'], config?: { isPinned?: boolean }) => {
    const memo = await this.repo.memos.findOneById(id, { isAvailableOnly: true });

    assert(memo, 'invalid memo id');
    assert(typeof config?.isPinned === 'boolean' ? memo.isPinned === config.isPinned : true, 'invalid pin status');
  };

  private async assertCanPin() {
    const memos = await this.repo.memos.findAll({ isPinned: true });
    const LIMIT = 10;

    assert(memos.length < LIMIT, `can not pin more than ${LIMIT} memos`);
  }
}
