import assert from 'assert';
import { container, singleton } from 'tsyringe';

import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '@domain/model/annotation.js';
import { EntityTypes, type EntityId } from '@domain/model/entity.js';
import { EventNames } from '@domain/model/content.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class AnnotationService extends BaseService {
  private readonly entityService = container.resolve(EntityService);
  public async create(annotation: AnnotationDTO) {
    await this.entityService.assertAvailableIds([annotation.targetId], {
      types: [EntityTypes.Note, EntityTypes.Material], // only note and material have annotations
    });

    // todo: verify annotation's selectors type here (not very necessary)
    return await this.repo.annotations.create(annotation);
  }

  public async queryByEntityId(entityId: EntityId) {
    await this.entityService.assertAvailableIds([entityId]);
    return this.repo.annotations.findAllByEntityId(entityId);
  }

  public async update(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const updated = await this.repo.annotations.update(annotationId, patch);
    assert(updated, 'invalid id');

    if (typeof patch.body === 'string') {
      this.eventBus.emit(EventNames.ContentUpdated, {
        content: patch.body,
        entityId: annotationId,
        entityType: EntityTypes.Annotation,
        updatedAt: updated.updatedAt,
      });
    }

    return updated;
  }
}
