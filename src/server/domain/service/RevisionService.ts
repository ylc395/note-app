import { createPatch, applyPatch } from 'diff';
import assert from 'node:assert';

import type { EntityId } from '@domain/model/entity.js';
import type { ContentUpdatedEvent } from '@domain/model/content.js';

import BaseService from './BaseService.js';

export default class RevisionService extends BaseService {
  constructor() {
    super();
    this.eventBus.on('contentUpdated', this.createRevision);
  }

  private readonly createRevision = async ({ content, entityId, updatedAt }: ContentUpdatedEvent) => {
    if (!(await this.shouldCreate(entityId))) {
      return;
    }

    const oldContent = await this.getOldContent(entityId);
    const diff = createPatch(entityId, oldContent, content);

    await this.repo.revisions.create({
      entityId,
      diff,
      createdAt: updatedAt,
      device: this.runtime.getDeviceName(),
    });
  };

  private async shouldCreate(entityId: EntityId) {
    let latestTime = await this.repo.revisions.getLatestRevisionTime(entityId);

    if (!latestTime) {
      const entity = await this.repo.entities.findOneById(entityId);
      assert(entity);

      latestTime = entity.createdAt;
    }

    return Date.now() - latestTime > 30 * 60 * 1000;
  }

  private async getOldContent(entityId: EntityId) {
    const revisions = await this.repo.revisions.findAllByEntityId(entityId);
    let result = '';

    for (const { diff } of revisions) {
      const applied = applyPatch(result, diff);
      assert(typeof applied === 'string', 'can not apply patch');

      result = applied;
    }

    return result;
  }
}
