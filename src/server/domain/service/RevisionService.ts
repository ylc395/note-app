import { createPatch, applyPatch } from 'diff';
import type { Subscription } from 'rxjs';
import { Inject } from '@nestjs/common';

import type { EntityLocator } from 'model/entity';
import type { ContentUpdate } from 'model/content';

import BaseService from './BaseService';
import ContentService from './ContentService';

export default class RevisionService extends BaseService {
  private revisionSubscription?: Subscription;

  @Inject() private readonly contentService!: ContentService;

  enableAutoCreateRevision() {
    this.revisionSubscription = this.contentService.tasks$.subscribe(this.createRevision);
  }

  private readonly createRevision = async ({ content, id, type }: ContentUpdate) => {
    if (!(await this.shouldCreate({ id, type }))) {
      return;
    }

    const oldContent = await this.getOldContent({ id, type });
    const diff = createPatch(`${type}-${id}`, oldContent || '', content);
    await this.repo.revisions.create({ entityId: id, entityType: type, diff });
  };

  private async shouldCreate(entity: EntityLocator) {
    const latestTime = await this.repo.revisions.getLatestRevisionTime(entity);

    if (latestTime) {
      return Date.now() - latestTime > 30 * 60 * 1000;
    }

    return true;
  }

  private async getOldContent({ id, type }: EntityLocator) {
    const revisions = await this.repo.revisions.findAll({ id, type });
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
