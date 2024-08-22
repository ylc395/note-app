import assert from 'assert';
import { container, singleton } from 'tsyringe';

import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '@domain/shared/model/annotation.js';
import { EntityTypes, type EntityId } from '@domain/shared/model/entity.js';
import { EventNames } from '@domain/server/model/content.js';

import BaseService from './BaseService.js';
import MaterialService from './MaterialService.js';
import EntityService from './EntityService.js';

@singleton()
export default class AnnotationService extends BaseService {
  private readonly materialService = container.resolve(MaterialService);

  @BaseService.transaction()
  public async create(annotation: AnnotationDTO) {
    const now = Date.now();

    // only materials have annotations
    await this.materialService.assertAvailableIds([annotation.targetId], { type: 'entity' });

    const created = await this.repo.annotations.create({
      id: EntityService.generateId(),
      targetId: annotation.targetId,
      body: annotation.body || '',
      selectors: annotation.selectors,
      color: annotation.color || 'yellow',
      createdAt: now,
      updatedAt: now,
    });

    if (created.body) {
      this.eventBus.emit(EventNames.ContentUpdated, {
        body: created.body,
        entityId: created.id,
        entityType: EntityTypes.Annotation,
        updatedAt: created.updatedAt,
      });
    }

    return created;
  }

  @BaseService.transaction()
  public async queryByEntityId(entityId: EntityId) {
    await this.materialService.assertAvailableIds([entityId]);
    return this.repo.annotations.findAllByEntityId(entityId, { isAvailableOnly: true });
  }

  @BaseService.transaction()
  public async updateOne(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const now = Date.now();
    const updated = await this.repo.annotations.update(annotationId, { ...patch, updatedAt: now });

    assert(updated, 'invalid id');

    if (typeof patch.body === 'string') {
      this.eventBus.emit(EventNames.ContentUpdated, {
        body: patch.body,
        entityId: annotationId,
        entityType: EntityTypes.Annotation,
        updatedAt: now,
      });
    }
  }
}
