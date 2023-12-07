import { createPatch, applyPatch } from 'diff';
import type { OnModuleInit } from '@nestjs/common';

import type { EntityLocator } from '@domain/model/entity.js';
import type { ContentUpdatedEvent } from '@domain/model/content.js';

import BaseService from './BaseService.js';

export default class RevisionService extends BaseService implements OnModuleInit {
  onModuleInit() {
    this.eventBus.on('contentUpdated', this.createRevision);
  }

  private readonly createRevision = async ({ content, entityId, entityType }: ContentUpdatedEvent) => {
    if (!(await this.shouldCreate({ entityId, entityType }))) {
      return;
    }

    const oldContent = await this.getOldContent({ entityId, entityType });
    const diff = createPatch(`${entityType}-${entityId}`, oldContent || '', content);
    await this.repo.revisions.create({ entityId, entityType, diff });
  };

  private async shouldCreate(entity: EntityLocator) {
    const latestTime = await this.repo.revisions.getLatestRevisionTime(entity);

    if (latestTime) {
      return Date.now() - latestTime > 30 * 60 * 1000;
    }

    return true;
  }

  private async getOldContent({ entityId: id, entityType: type }: EntityLocator) {
    const revisions = await this.repo.revisions.findAll({ entityId: id, entityType: type });
    let result = '';

    for (const { diff } of revisions) {
      const applied = applyPatch(result, diff);

      if (applied === false) {
        throw new Error('can not apply patch');
      }

      result = applied;
    }

    return result;
  }
}
