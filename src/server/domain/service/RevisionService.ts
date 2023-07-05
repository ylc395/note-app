import { createPatch, applyPatch } from 'diff';

import { type EntityLocator, EntityTypes } from 'interface/entity';
import type { MemoVO } from 'interface/memo';
import type { RevisionVO } from 'interface/revision';
import type { RawNoteVO } from 'model/note';
import { type ContentUpdatedEvent, Events, OnEvent } from 'model/events';

import BaseService from './BaseService';

const MAX_INTERVAL_MINUTES = 1;

export default class RevisionService extends BaseService {
  private async submit(entity: EntityLocator, { newContent, oldContent }: { newContent: string; oldContent?: string }) {
    const diff = createPatch(`${entity.type}-${entity.id}`, oldContent || '', newContent);
    await this.revisions.create({ entityId: entity.id, entityType: entity.type, diff });
  }

  @OnEvent(Events.ContentUpdated)
  async createRevision({ content, isImportant, ...entityLocator }: ContentUpdatedEvent) {
    const latestRevision = await this.revisions.findLatest(entityLocator);
    let shouldSubmit = isImportant || entityLocator.type !== EntityTypes.Note;

    if (!shouldSubmit) {
      const createdAt = latestRevision?.createdAt || (await this.getCreatedAt(entityLocator));
      shouldSubmit ||= Date.now() - createdAt * 1000 >= MAX_INTERVAL_MINUTES * 60 * 1000;
    }

    if (shouldSubmit) {
      const oldContent = latestRevision ? await this.getContentByRevision(latestRevision) : undefined;
      await this.submit(entityLocator, { newContent: content, oldContent });
    }
  }

  private async getCreatedAt(entityLocator: EntityLocator) {
    let entity: RawNoteVO | MemoVO | null;

    switch (entityLocator.type) {
      case EntityTypes.Note:
        entity = await this.notes.findOneById(entityLocator.id);
        break;
      case EntityTypes.Memo:
        entity = await this.memos.findOneById(entityLocator.id);
        break;
      default:
        throw new Error('unsupported type');
    }

    if (!entity) {
      throw new Error('invalid entity');
    }

    return entity.createdAt;
  }

  private async getContentByRevision(revision: RevisionVO) {
    const revisions = await this.revisions.findUtil(revision.id);

    let result = '';
    for (const { diff } of revisions) {
      result = applyPatch(result, diff);
    }

    return result;
  }
}
