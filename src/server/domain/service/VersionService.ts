import { createPatch, applyPatch, parsePatch } from 'diff';
import { singleton } from 'tsyringe';
import assert from 'node:assert';
import { first } from 'lodash-es';

import { EntityTypes, type EntityId } from '@domain/model/entity.js';
import type { Version, VersionDTO, VersionMergeRequest, IndexRange } from '@domain/model/version.js';
import { EventNames, type ContentUpdatedEvent } from '@domain/model/content.js';

import BaseService, { transaction } from './BaseService.js';

@singleton()
export default class VersionService extends BaseService {
  constructor() {
    super();
    this.eventBus.on(EventNames.ContentUpdated, this.autoCreate.bind(this));
  }

  public async getDiff(id: EntityId, content: string) {
    const latestVersionContent = await this.getVersionContent(id);
    const diff = first(parsePatch(createPatch(id, content, latestVersionContent)));
    assert(diff);

    return diff;
  }

  public async create(
    event: ContentUpdatedEvent | VersionDTO,
    options?: { isAuto: boolean; latestVersion: Version | null },
  ) {
    const entity = 'content' in event ? event : await this.repo.entities.findOneById(event.entityId);
    assert(entity);

    const isAuto = options?.isAuto ?? false;
    const latestVersion = options?.latestVersion;

    const { content, updatedAt } = entity;
    const entityId = 'entityId' in entity ? entity.entityId : entity.id;
    const oldContent = await this.getVersionContent(entityId);
    const diff = VersionService.createDiffText({ oldContent, newContent: content, entityId });

    if (!diff) {
      return;
    }

    const latestIndex = latestVersion?.index || (await this.repo.versions.findLatest(entityId))?.index || 0;

    await this.repo.versions.create({
      entityId,
      isAuto,
      diff, // this diff info is too large. Is there any better solution?🤔
      comment: 'comment' in event && event.comment ? event.comment : '',
      createdAt: updatedAt,
      device: this.runtime.getDeviceName(),
      index: latestIndex + 1,
    });
  }

  @transaction
  private async autoCreate(e: ContentUpdatedEvent) {
    const latestVersion = await this.repo.versions.findLatest(e.entityId);

    // check whether a new version should be auto-created
    if (e.entityType === EntityTypes.Note) {
      let latestTime = latestVersion?.createdAt;

      if (!latestTime) {
        const entity = await this.repo.entities.findOneById(e.entityId);
        assert(entity);

        latestTime = entity.createdAt;
      }

      if (Date.now() - latestTime < 0.5 * 60 * 1000) {
        return;
      }
    }

    await this.create(e, { latestVersion, isAuto: true });
  }

  @transaction
  public async merge({ startIndex, endIndex, entityId, comment = '' }: VersionMergeRequest) {
    assert(endIndex > startIndex, 'invalid merge index');
    const { oldContent, newContent, createdAt } = await this.getVersionContent(entityId, { startIndex, endIndex });
    const diff = VersionService.createDiffText({ oldContent, newContent, entityId });

    assert(diff, 'invalid diff');

    await this.repo.versions.remove(entityId, { startIndex, endIndex });
    await this.repo.versions.create({
      entityId,
      isAuto: false,
      diff,
      comment,
      createdAt,
      device: this.runtime.getDeviceName(),
      index: endIndex,
    });
  }

  private async getVersionContent(
    entityId: EntityId,
    range: IndexRange,
  ): Promise<{ oldContent: string; newContent: string; createdAt: number }>;
  private async getVersionContent(entityId: EntityId): Promise<string>;
  private async getVersionContent(entityId: EntityId, range?: IndexRange) {
    const versions = await this.repo.versions.findAllByEntityId(entityId, range?.endIndex);

    if (range) {
      assert(versions.length >= 2, 'invalid index');
    }

    let content = '';
    const result = { oldContent: '', newContent: '', createdAt: 0 };

    for (const { diff, createdAt, index: i } of versions) {
      const applied = applyPatch(content, diff);
      assert(typeof applied === 'string', 'can not apply patch');

      if (i === range?.startIndex) {
        result.oldContent = applied;
      }

      if (i === range?.endIndex) {
        result.createdAt = createdAt;
        result.newContent = applied;
      }

      content = applied;
    }

    return range ? result : content;
  }

  private static createDiffText({
    oldContent,
    newContent,
    entityId,
  }: {
    oldContent: string;
    newContent: string;
    entityId: EntityId;
  }) {
    const diff = createPatch(entityId, oldContent, newContent); // this diff info is too large. Is there any better solution?🤔
    const parsed = first(parsePatch(diff));

    if (!parsed || parsed.hunks.length === 0) {
      return null;
    }

    return diff;
  }
}
