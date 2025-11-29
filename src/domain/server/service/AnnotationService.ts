import assert from 'node:assert';

import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import type { EntityId } from '#domain/shared/model/entity.js';
import container from '#utils/singletonContainer.js';

import BaseService from './BaseService.js';
import NoteService from './NoteService.js';
import EntityService from './EntityService.js';
import ContentService from './ContentService/index.js';
import RevisionService from './RevisionService.js';

export default class AnnotationService extends BaseService {
  private readonly noteService = container.resolve(NoteService);

  private readonly content = container.resolve(ContentService);

  private readonly revision = container.resolve(RevisionService);

  @BaseService.transaction
  public async create(annotation: AnnotationDTO) {
    // only notes have annotations
    await this.noteService.assertAvailableIds([annotation.parentId], { withFile: true });

    const now = Date.now();
    const created = await this.repo.annotations.create({
      id: EntityService.generateId(),
      parentId: annotation.parentId,
      body: annotation.body || '',
      selector: annotation.selector,
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
    const updatedAt = typeof patch.body === 'string' ? Date.now() : undefined;

    const annotation = {
      ...patch,
      updatedAt,
    };
    const updated = await this.repo.annotations.update(id, annotation);
    assert(updated, 'invalid id');

    if (updatedAt) {
      await this.content.extract({ id, body: patch.body });
      await this.revision.createOne(id, updatedAt, { body: patch.body });
    }
  }
}
