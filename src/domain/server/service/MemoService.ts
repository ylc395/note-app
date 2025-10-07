import { groupBy, keyBy, mapValues, size } from 'lodash-es';
import assert from 'node:assert';
import dayjs from 'dayjs';

import { arrayOf } from '#utils/collection.js';
import type { Memo, MemoDTO, ClientMemoQuery, MemoVO, MemoPatchDTO, Duration } from '#domain/server/model/memo.js';
import container from '#utils/singletonContainer.js';
import { EntityTypes } from '#domain/shared/model/entity.js';
import { SearchFields } from '#domain/shared/model/search.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';
import ContentService from './ContentService/index.js';
import type { LinkVO } from '../model/content.js';
import RevisionService from './RevisionService.js';

export default class MemoService extends BaseService {
  private readonly content = container.resolve(ContentService);

  private readonly revision = container.resolve(RevisionService);

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
      await this.revision.createOne(newMemo.id, now, newMemo);
    }

    return this.toVO(newMemo, true);
  }

  @BaseService.transaction
  public async updateOne(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.assertAvailableId(id, { isPinned: typeof patch.isPinned === 'boolean' ? !patch.isPinned : undefined });
    const bodyUpdated = typeof patch.body === 'string';

    const updatedAt = bodyUpdated ? Date.now() : undefined;

    await this.repo.memos.update(id, {
      ...patch,
      updatedAt,
    });

    if (updatedAt) {
      await this.content.extract({ id, body: patch.body });
      await this.revision.createOne(id, updatedAt, { body: patch.body });
    }
  }

  @BaseService.transaction
  public async queryList(query: ClientMemoQuery) {
    assert(
      !(query.keyword && (query.limit || typeof query.isPinned === 'boolean')),
      'can not set limit / isPinned with keyword',
    );

    let durations;

    if (query.durations && query.durations.length > 0) {
      assert(
        query.durations.every(({ endTime, startTime }) => !startTime || !endTime || endTime >= startTime),
        'endTime must be greater than startTime',
      );

      durations = query.durations;
    }

    if (query.startId) {
      const startMemo = await this.repo.memos.findOneById(query.startId, { isAvailableOnly: true });
      assert(startMemo, 'invalid start id');

      const time = startMemo.createdAt;

      durations = durations
        ?.filter(({ endTime }) => !endTime || endTime >= time)
        .map(({ startTime, endTime }) => {
          if (startTime && startTime < time) {
            return { startTime: time, endTime };
          }

          return { startTime, endTime };
        }) ?? [{ startTime: time }];
    }

    if (query.endId) {
      const endMemo = await this.repo.memos.findOneById(query.endId, { isAvailableOnly: true });
      assert(endMemo, 'invalid end id');
      const time = endMemo.createdAt;

      durations = durations
        ?.filter(({ startTime }) => !startTime || startTime <= time)
        .map(({ startTime, endTime }) => {
          if (endTime && endTime > time) {
            return { startTime, endTime: time };
          }

          return { startTime, endTime };
        }) ?? [{ endTime: time }];
    }

    let ids: string[] | undefined;

    // 对于有 keyword 的查询，单独使用 searchEngine 先查一下。
    // 理论上也能在 repo.memo 里查，这里是考虑到全文搜索未必是用 sql 表来实现的，因此不放在 repo 里查了
    if (query.keyword) {
      const searchResult = await this.searchEngine.search({
        entityTypes: [EntityTypes.Memo],
        keyword: query.keyword,
        fields: [SearchFields.Body],
      });

      ids = searchResult.map(({ entityId }) => entityId);
    }

    const memos = await this.repo.memos.findAll({
      ...query,
      id: ids,
      isAvailableOnly: true,
      durations,
      parentId: query.parentId || null,
      limit: query.limit ?? (query.keyword ? undefined : 30),
      order: query.order ?? 'desc',
    });

    return await this.toVO(memos);
  }

  @BaseService.transaction
  public async queryAvailableDates(duration: Duration) {
    const memos = await this.repo.memos.findAll({
      ...duration,
      parentId: null,
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

    if (_memos.length === 0) {
      return [];
    }

    const ids = _memos.map(({ id }) => id);
    const stars = isNew ? {} : keyBy(await this.repo.stars.findAll({ entityIds: ids }), ({ entityId }) => entityId);
    const childrenIds = isNew ? {} : await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });
    const referrers = await this.repo.contents.findAllLinks({
      direction: 'end',
      entityId: ids,
      isAvailableOnly: true,
    });

    const referrersMap = Object.groupBy(referrers, ({ target }) => target);
    const result = _memos.map((memo) => ({
      ...memo,
      followupsCount: childrenIds[memo.id]?.length || 0,
      referrersCount: referrersMap[memo.id]?.length ?? 0,
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

  public async queryCount(query: ClientMemoQuery) {
    return this.repo.memos.queryCount(query);
  }

  public async queryAvailableDateRange() {
    const [firstOne, lastOne] = await Promise.all([
      this.repo.memos.findAll({
        limit: 1,
        order: 'asc',
        parentId: null,
        isAvailableOnly: true,
      }),
      this.repo.memos.findAll({
        limit: 1,
        order: 'desc',
        parentId: null,
        isAvailableOnly: true,
      }),
    ]);

    if (!firstOne[0] || !lastOne[0]) {
      return null;
    }

    return {
      start: firstOne[0].createdAt,
      end: lastOne[0].createdAt,
    };
  }

  public async queryReferrers(id: Memo['id']) {
    await this.assertAvailableId(id);
    const links = await this.content.queryLinksOf(id, { direction: 'end' });

    return links as LinkVO[];
  }
}
