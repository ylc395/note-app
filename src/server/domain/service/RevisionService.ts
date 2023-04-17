import { OnEvent } from '@nestjs/event-emitter';
import { createPatch, applyPatch } from 'diff';

import { type EntityLocator, EntityTypes } from 'interface/entity';
import type { NoteVO } from 'interface/note';
import type { RevisionVO } from 'interface/revision';

import BaseService from './BaseService';
import type { NoteBodyUpdatedEvent } from 'service/NoteService';
import type { MemoContentUpdatedEvent } from 'service/MemoService';

const MAX_INTERVAL_MINUTES = 1;

export default class RevisionService extends BaseService {
  private async submit(entity: EntityLocator, { newContent, oldContent }: { newContent: string; oldContent?: string }) {
    const diff = createPatch(`${entity.type}-${entity.id}`, oldContent || '', newContent);
    await this.revisions.create({ entityId: entity.id, entityType: entity.type, diff });
  }

  @OnEvent('updated.content.*')
  async createRevision({ content, ...entityLocator }: NoteBodyUpdatedEvent | MemoContentUpdatedEvent, force?: true) {
    const latestRevision = await this.revisions.findLatest(entityLocator);
    let shouldSubmit = force || entityLocator.type !== EntityTypes.Note;

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
    let entity: NoteVO | null;

    switch (entityLocator.type) {
      case EntityTypes.Note:
        entity = await this.notes.findOneById(entityLocator.id);
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
