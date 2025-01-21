import { groupBy, keyBy, mapValues, size } from 'lodash-es';
import assert from 'node:assert';
import dayjs from 'dayjs';

import { arrayOf } from '#utils/collection.js';
import type { Memo, MemoDTO, ClientMemoQuery, MemoVO, MemoPatchDTO, Duration } from '#domain/server/model/memo.js';
import { container } from '#domain/shared/infra/singletons.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';
import ContentService from './ContentService/index.js';

export default class MemoService extends BaseService {
  private readonly content = container.resolve(ContentService);

  @BaseService.transaction
  public async create(memo: MemoDTO) {
    if (memo.parentId) {
      assert(typeof memo.isPinned === 'undefined', 'can not pin/unpin a child memo');
      await this.assertAvailableId(memo.parentId, { isTop: true });
    }

    const now = Date.now();
    const newMemo = await this.repo.memos.create({
      id: EntityService.generateId(),
      updatedAt: now,
      createdAt: now,
      parentId: memo.parentId || null,
      isPinned: memo.isPinned || false,
      body: memo.body,
    });

    if (memo.body) {
      await this.content.extract(newMemo);
    }

    return this.toVO(newMemo, true);
  }

  @BaseService.transaction
  public async updateOne(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.assertAvailableId(id, { isPinned: typeof patch.isPinned === 'boolean' ? !patch.isPinned : undefined });

    const hasContentUpdated = typeof patch.body === 'string';

    await this.repo.memos.update(id, {
      ...patch,
      updatedAt: hasContentUpdated ? Date.now() : undefined,
    });

    if (hasContentUpdated) {
      await this.content.extract({ id, body: patch.body });
    }
  }

  @BaseService.transaction
  public async queryList(query: ClientMemoQuery) {
    assert(!(query.startId && query.startTime), 'can not use both startId and startTime');
    assert(!(query.endId && query.endTime), 'can not use both endId and endTime');

    let startTime = query.startTime;
    let endTime = query.endTime;

    if (query.startId) {
      const startMemo = await this.repo.memos.findOneById(query.startId, { isAvailableOnly: true });
      assert(startMemo, 'invalid start id');

      startTime = query.orderBy === 'updatedAt' ? startMemo.updatedAt : startMemo.createdAt;
    }

    if (query.endId) {
      const endMemo = await this.repo.memos.findOneById(query.endId, { isAvailableOnly: true });
      assert(endMemo, 'invalid end id');

      endTime = query.orderBy === 'updatedAt' ? endMemo.updatedAt : endMemo.createdAt;
    }

    const memos = await this.repo.memos.findAll({
      isAvailableOnly: true,
      limit: query.limit,
      startTime,
      endTime,
      parentId: query.parentId || null,
      isPinned: query.isPinned,
      order: query.order,
      orderBy: query.orderBy,
    });

    return await this.toVO(memos);
  }

  @BaseService.transaction
  public async queryAvailableDates(duration: Duration) {
    const memos = await this.repo.memos.findAll({
      ...duration,
      isAvailableOnly: true,
    });

    return mapValues(
      groupBy(memos, (memo) => dayjs(memo.createdAt).startOf('day').format('YYYY-MM-DD')),
      size,
    );
  }

  private async toVO(memos: Memo, isNew?: boolean): Promise<MemoVO>;
  private async toVO(memos: Memo[]): Promise<MemoVO[]>;
  private async toVO(memos: Memo[] | Memo, isNew?: boolean): Promise<MemoVO[] | MemoVO> {
    const _memos = arrayOf(memos);
    const ids = _memos.map(({ id }) => id);
    const stars = isNew ? {} : keyBy(await this.repo.stars.findAll({ entityIds: ids }), ({ entityId }) => entityId);
    const childrenIds = isNew ? {} : await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });

    const result = _memos.map((memo) => ({
      ...memo,
      childrenCount: childrenIds[memo.id]?.length || 0,
      referrers: [], // todo: 从 ContentService 里取
      isStar: Boolean(stars[memo.id]),
    }));

    return Array.isArray(memos) ? result : result[0]!;
  }

  public async queryOne(id: Memo['id'], isVO: true): Promise<MemoVO>;
  public async queryOne(id: Memo['id']): Promise<Memo>;
  public async queryOne(id: Memo['id'], isVO?: true) {
    const memo = await this.repo.memos.findOneById(id, { isAvailableOnly: true });
    assert(memo, 'invalid memo id');

    if (isVO) {
      return this.toVO(memo);
    }

    return memo;
  }

  private readonly assertAvailableId = async (id: MemoVO['id'], config?: { isPinned?: boolean; isTop?: boolean }) => {
    const memo = await this.queryOne(id);

    if (typeof config?.isPinned === 'boolean') {
      assert(memo.isPinned === config.isPinned, 'invalid pin status');
    }

    if (config?.isTop) {
      assert(!memo.parentId, 'not a top memo');
    }
  };

  public queryCount() {}
}
