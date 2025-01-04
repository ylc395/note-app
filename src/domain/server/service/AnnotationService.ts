import assert from 'node:assert';

import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import type { EntityId } from '#domain/shared/model/entity.js';
import { container } from '#domain/shared/infra/singletons.js';

import BaseService from './BaseService.js';
import NoteService from './NoteService.js';
import EntityService from './EntityService.js';
import ContentService from './ContentService/index.js';

export default class AnnotationService extends BaseService {
  private readonly noteService = container.resolve(NoteService);
  private readonly content = container.resolve(ContentService);

  @BaseService.transaction
  public async create(annotation: AnnotationDTO) {
    assert(annotation.selectors.length > 0, 'empty selectors of annotation');

    // only notes have annotations
    await this.noteService.assertAvailableIds([annotation.targetId], { withFile: true });

    const now = Date.now();
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

  @BaseService.transaction
  public async queryByEntityId(entityId: EntityId) {
    await this.noteService.assertAvailableIds([entityId]);
    return this.repo.annotations.findAllByEntityId(entityId, { isAvailableOnly: true });
  }

  @BaseService.transaction
  public async queryOne(annotationId: EntityId) {
    const annotation = await this.repo.annotations.findOneById(annotationId, { isAvailableOnly: true });
    assert(annotation, 'invalid annotation id');

    return annotation;
  }

  @BaseService.transaction
  public async updateOne(id: Annotation['id'], patch: AnnotationPatchDTO) {
    const hasContentUpdated = typeof patch.body === 'string';

    const annotation = {
      ...patch,
      updatedAt: hasContentUpdated ? Date.now() : undefined,
    };
    const updated = await this.repo.annotations.update(id, annotation);
    assert(updated, 'invalid id');

    if (hasContentUpdated) {
      await this.content.extract({ id: id, body: patch.body });
    }

    return this.queryOne(id);
  }
}
