import { createPatch, applyPatch } from 'diff';

import type { EntityLocator } from 'model/entity';
import type { ContentUpdate } from 'model/content';

import BaseService from './BaseService';

export default class RevisionService extends BaseService {
  async createRevision({ content, id, type }: ContentUpdate) {
    const oldContent = await this.getOldContent({ id, type });
    const diff = createPatch(`${type}-${id}`, oldContent || '', content);
    await this.revisions.create({ entityId: id, entityType: type, diff });
  }

  private async getOldContent({ id, type }: EntityLocator) {
    const revisions = await this.revisions.findAll({ id, type });
    let result = '';

    for (const { diff } of revisions) {
      result = applyPatch(result, diff);
    }

    return result;
  }
}
