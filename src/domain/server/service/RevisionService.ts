import assert from 'assert';
import { applyPatch, structuredPatch } from 'diff';

import type { Revision, RevisionPatchDTO } from '#domain/shared/model/revision.js';
import { buildIndex } from '#utils/collection.js';
import BaseService from './BaseService.js';

export default class RevisionService extends BaseService {
  constructor() {
    super();
    this.runtime.ready().then(this.bootstrap.bind(this));
  }

  private isBusy = false;

  private bootstrap() {
    setInterval(this.createRevisions.bind(this), 1 * 60 * 1000);
  }

  @BaseService.transaction
  private async createRevisions() {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    const interval = 30 * 60 * 1000; // todo: 从用户设置中取

    const entities = await this.repo.revisions.findEntitiesWithoutRevisionBefore({
      isAvailableOnly: true,
      before: Date.now() - interval,
    });

    if (entities.length === 0) {
      this.isBusy = false;
      return;
    }

    const ids = entities.map(({ id }) => id);
    const entitiesMap = buildIndex(entities);

    const revisionsMap = Object.groupBy(
      await this.repo.revisions.findAll({ entityIds: ids }),
      (revision) => revision.entityId,
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
        id: BaseService.generateId(),
        createdAt: entity.updatedAt,
        titleDiff: titleUpdated ? structuredPatch('', '', oldText.title, entity.title) : null,
        bodyDiff: bodyUpdated ? structuredPatch('', '', oldText.body, body) : null,
        name: '',
        isAuto: true,
        appName: this.runtime.appName,
        deviceName: this.runtime.getDeviceName(),
        previousId: oldText.previousId,
      });
    }

    await this.repo.revisions.batchCreate(newRevisions);
    this.isBusy = false;
  }

  @BaseService.transaction
  public async update(id: Revision['id'], patch: RevisionPatchDTO) {
    const revision = await this.repo.revisions.findAll({ ids: [id], isAvailableOnly: true });
    assert(revision.length > 0, 'invalid revision id');

    await this.repo.revisions.updateOne(id, patch);
  }

  private static getText(revisions: Revision[]) {
    const revisionsMap = buildIndex(revisions, 'previousId');
    let revision = revisions.find(({ previousId }) => !previousId);

    const result: {
      title: string;
      body: string;
      previousId: Revision['previousId'];
    } = {
      title: '',
      body: '',
      previousId: null,
    };

    if (!revision) {
      return result;
    }

    while (revision) {
      if (revision.titleDiff) {
        const title = applyPatch(result.title, revision.titleDiff);

        if (typeof title === 'string') {
          result.title = title;
        } else {
          break;
        }
      }

      if (revision.bodyDiff) {
        const body = applyPatch(result.body, revision.bodyDiff);

        if (typeof body === 'string') {
          result.body = body;
        } else {
          break;
        }
      }

      result.previousId = revision.id;
      revision = revisionsMap[revision.id];
    }

    return result;
  }
}
