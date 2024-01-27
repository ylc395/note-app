import assert from 'assert';
import { container, singleton } from 'tsyringe';

import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '@domain/model/annotation.js';
import { type EntityId, EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class AnnotationService extends BaseService {
  private readonly entityService = container.resolve(EntityService);
  public async create(annotation: AnnotationDTO) {
    await this.entityService.assertEntityIds([annotation.targetId]);
    // todo: verify annotation type here (not very necessary)
    return await this.repo.annotations.create(annotation);
  }

  public async queryByEntityId(entityId: EntityId) {
    await this.entityService.assertEntityIds([entityId]);
    return this.repo.annotations.findAllByEntityId(entityId);
  }

  public async update(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const updated = await this.repo.annotations.update(annotationId, patch);
    assert(updated, 'invalid id');

    if (typeof patch.body === 'string') {
      this.eventBus.emit('contentUpdated', {
        content: patch.body,
        entityType: EntityTypes.Annotation,
        entityId: annotationId,
        updatedAt: updated.updatedAt,
      });
    }

    return updated;
  }
}
