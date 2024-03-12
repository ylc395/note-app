import { createPatch, applyPatch, parsePatch } from 'diff';
import { singleton } from 'tsyringe';
import assert from 'node:assert';
import { first } from 'lodash-es';

import { EntityTypes, type EntityId } from '@domain/model/entity.js';
import type { VersionDTO } from '@domain/model/version.js';
import type { ContentUpdatedEvent } from '@domain/model/content.js';

import BaseService, { transaction } from './BaseService.js';

@singleton()
export default class VersionService extends BaseService {
  constructor() {
    super();
    this.eventBus.on('contentUpdated', this.autoCreate.bind(this));
  }

  public async queryDiff(id: EntityId, content: string) {
    const latestVersionContent = await this.getLatestVersionContent(id);
    const diff = first(parsePatch(createPatch(id, content, latestVersionContent)));
    assert(diff);

    return diff;
  }

  public async create(event: ContentUpdatedEvent | VersionDTO, isAuto = false) {
    const entity = 'content' in event ? event : await this.repo.entities.findOneById(event.entityId);
    assert(entity);

    const { entityId, content, updatedAt } = entity;
    const oldContent = await this.getLatestVersionContent(entityId);
    const diff = createPatch(entityId, oldContent, content);
    const parsed = first(parsePatch(diff));

    if (!parsed || parsed.hunks.length === 0) {
      return;
    }

    await this.repo.versions.create({
      entityId,
      isAuto,
      diff, // this diff info is too large. Is there any better solution?🤔
      comment: 'comment' in event && event.comment ? event.comment : '',
      createdAt: updatedAt,
      device: this.runtime.getDeviceName(),
    });
  }

  @transaction
  private async autoCreate(e: ContentUpdatedEvent) {
    // check whether a new version should be auto-created
    if (e.entityType === EntityTypes.Note) {
      let latestTime = await this.repo.versions.getLatestRevisionTime(e.entityId);

      if (!latestTime) {
        const entity = await this.repo.entities.findOneById(e.entityId);
        assert(entity);

        latestTime = entity.createdAt;
      }

      if (Date.now() - latestTime < 0.5 * 60 * 1000) {
        return;
      }
    }

    await this.create(e, true);
  }

  private async getLatestVersionContent(entityId: EntityId) {
    const revisions = await this.repo.versions.findAllByEntityId(entityId);
    let result = '';

    for (const { diff } of revisions) {
      const applied = applyPatch(result, diff);
      assert(typeof applied === 'string', 'can not apply patch');

      result = applied;
    }

    return result;
  }
}
