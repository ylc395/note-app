import assert from 'assert';
import { container, singleton } from 'tsyringe';

import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '@domain/shared/model/annotation.js';
import { EntityTypes, type EntityId } from '@domain/shared/model/entity.js';

import BaseService from './BaseService.js';
import MaterialService from './MaterialService.js';
import EntityService from './EntityService.js';
import EventService from './EventService.js';
import { EventNames } from '../model/entity.js';

@singleton()
export default class AnnotationService extends BaseService {
  private readonly materialService = container.resolve(MaterialService);
  private readonly event = container.resolve(EventService);

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

    await this.event.create({
      type: EventNames.Created,
      entityLocator: {
        entityId: created.id,
        entityType: EntityTypes.Annotation,
      },
      payload: created,
    });

    return created;
  }

  @BaseService.transaction()
  public async queryByEntityId(entityId: EntityId) {
    await this.materialService.assertAvailableIds([entityId]);
    return this.repo.annotations.findAllByEntityId(entityId, { isAvailableOnly: true });
  }

  @BaseService.transaction()
  public async updateOne(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const annotation = {
      ...patch,
      updatedAt: Date.now(),
    };
    const updated = await this.repo.annotations.update(annotationId, annotation);

    assert(updated, 'invalid id');

    await this.event.create({
      type: EventNames.Updated,
      entityLocator: {
        entityId: annotationId,
        entityType: EntityTypes.Annotation,
      },
      payload: annotation,
    });
  }
}
