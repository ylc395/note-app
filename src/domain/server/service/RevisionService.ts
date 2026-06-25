import assert from 'assert';
import { applyPatch, createPatch } from 'diff';
import { keyBy } from 'lodash-es';

import type { Revision, RevisionPatchDTO } from '#domain/shared/model/revision.js';
import type { EntityId } from '#domain/shared/model/entity.js';
import container from '#utils/singletonContainer.js';
import { generateId } from '#domain/server/infra/id.js';
import { transactional } from '#domain/server/infra/transaction.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

export default class RevisionService extends BaseService {
  constructor() {
    super();
    this.runtime.ready().then(this.bootstrap.bind(this));
  }

  private isBusy = false;

  private readonly entity = container.resolve(EntityService);

  private interval?: number;

  private async bootstrap() {
    this.interval = 1 * 60 * 1000; // todo: 从用户设置中取

    if (this.interval) {
      await this.autoCreateRevisions();
      setInterval(this.autoCreateRevisions.bind(this), this.interval);
    }
  }

  @transactional
  private async autoCreateRevisions() {
    assert(this.interval);

    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    const KEY = 'revision.lastTime';
    const lastTime = Number((await this.kv.get(KEY)) ?? 0);
    const thisTime = Date.now();

    if (thisTime - lastTime < this.interval) {
      return;
    }

    const entities = await this.repo.revisions.findEntitiesWithoutRevision({
      isAvailableOnly: true,
      updatedAfter: lastTime,
    });

    if (entities.length === 0) {
      this.isBusy = false;
      return;
    }

    const ids = entities.map(({ id }) => id);
    const entitiesMap = keyBy(entities, ({ id }) => id);

    const revisionsMap = Object.groupBy(
      await this.repo.revisions.findAll({ entityIds: ids }),
      ({ entityId }) => entityId,
    );

    const contents = await this.repo.entities.findAllContents(ids);
    const newRevisions: Revision[] = [];

    for await (const { id, body } of contents) {
      const entity = entitiesMap[id];
      assert(entity);

      const oldText = RevisionService.getText(revisionsMap[id] || []);
      const titleUpdated = entity.title !== oldText.title;
      const bodyUpdated = body !== oldText.body;

      if (!titleUpdated && !bodyUpdated) {
        continue;
      }

      newRevisions.push({
        entityId: id,
        id: generateId(),
        createdAt: thisTime,
        titleDiff: titleUpdated ? createPatch('', oldText.title, entity.title) : null,
        bodyDiff: bodyUpdated ? createPatch('', oldText.body, body) : null,
        name: '',
        isAuto: true,
        appName: this.runtime.appName,
        deviceName: this.runtime.getDeviceName(),
        previousId: oldText.previousId,
      });
    }

    await this.repo.revisions.batchCreate(newRevisions);
    await this.kv.set(KEY, String(thisTime));
    this.isBusy = false;
  }

  @transactional
  public async update(id: Revision['id'], patch: RevisionPatchDTO) {
    const revision = await this.repo.revisions.findAll({ ids: [id], isAvailableOnly: true });
    assert(revision.length > 0, 'invalid revision id');

    await this.repo.revisions.updateOne(id, patch);
  }

  public async createOne(entityId: EntityId, time: number, latest: { body?: string; title?: string }) {
    const revisions = await this.repo.revisions.findAll({ entityIds: [entityId] });
    const oldText = RevisionService.getText(revisions);

    await this.repo.revisions.batchCreate([
      {
        entityId,
        id: generateId(),
        createdAt: time,
        titleDiff: typeof latest.title === 'string' ? createPatch('', oldText.title, latest.title) : null,
        bodyDiff: typeof latest.body === 'string' ? createPatch('', oldText.body, latest.body) : null,
        name: '',
        isAuto: false,
        appName: this.runtime.appName,
        deviceName: this.runtime.getDeviceName(),
        previousId: oldText.previousId,
      },
    ]);
  }

  private static sort(revisions: Revision[]) {
    if (revisions.length === 0) return [];

    const nextByPreviousId = new Map<Revision['previousId'], Revision>();
    for (const rev of revisions) {
      nextByPreviousId.set(rev.previousId, rev);
    }

    let node = nextByPreviousId.get(null);
    const sorted: Revision[] = [];

    while (node) {
      sorted.push(node);
      node = nextByPreviousId.get(node.id);
    }

    return sorted;
  }

  private static getText(revisions: Revision[]) {
    const sortedRevisions = RevisionService.sort(revisions);

    return sortedRevisions.reduce(
      (result, revision) => {
        const newResult = { ...result, previousId: revision.id };

        if (revision.titleDiff) {
          const title = applyPatch(result.title, revision.titleDiff);

          if (typeof title === 'string') {
            newResult.title = title;
          }
        }

        if (revision.bodyDiff) {
          const body = applyPatch(result.body, revision.bodyDiff);

          if (typeof body === 'string') {
            newResult.body = body;
          }
        }

        return newResult;
      },
      { title: '', body: '', previousId: null as Revision['previousId'] },
    );
  }

  public async queryRevisionsOf(entityId: EntityId) {
    await this.entity.assertAvailableIds([entityId]);
    const revisions = await this.repo.revisions.findAll({ entityIds: [entityId] });

    return RevisionService.sort(revisions);
  }
}
