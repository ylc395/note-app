import assert from 'node:assert';
import { container, singleton } from 'tsyringe';

import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '@domain/shared/model/annotation.js';
import type { EntityId } from '@domain/shared/model/entity.js';

import BaseService from './BaseService.js';
import MaterialService from './MaterialService.js';
import EntityService from './EntityService.js';
import ContentService from './ContentService/index.js';

@singleton()
export default class AnnotationService extends BaseService {
  private readonly materialService = container.resolve(MaterialService);
  private readonly content = container.resolve(ContentService);

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
      await this.content.extract(created);
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
    const hasContentUpdated = typeof patch.body === 'string';

    const annotation = {
      ...patch,
      updatedAt: hasContentUpdated ? Date.now() : undefined,
    };
    const updated = await this.repo.annotations.update(annotationId, annotation);
    assert(updated, 'invalid id');

    if (hasContentUpdated) {
      await this.content.extract({ id: annotationId, body: patch.body });
    }
  }
}
