import { Emitter } from 'strict-event-emitter';
import assert from 'assert';
import { type EntityLocator, type EntityId, EntityTypes } from 'model/entity';

import {
  type default as EditableEntity,
  type EditableEntityLocator,
  EventNames as EditableEntityEvents,
} from 'model/abstract/EditableEntity';
import EditableNote from 'model/note/Editable';
import EditablePdf from 'model/material/editable/EditablePdf';
import EditableHtml from 'model/material/editable/EditableHtml';
import EditableImage from 'model/material/editable/EditableImage';
import { singleton } from 'tsyringe';

export enum EventNames {
  entityUpdated = 'editorManager.entityUpdated',
}

type Events = {
  [EventNames.entityUpdated]: [EditableEntity];
};

@singleton()
export default class EditableEntityManager extends Emitter<Events> {
  private readonly editableEntities: Record<EntityId, EditableEntity> = {};

  private createEditableEntity({ entityId, entityType, mimeType }: EditableEntityLocator) {
    let editableEntity = this.editableEntities[entityId];

    if (editableEntity) {
      return editableEntity;
    }

    switch (entityType) {
      case EntityTypes.Note:
        editableEntity = new EditableNote(entityId);
        break;
      case EntityTypes.Material:
        editableEntity = this.createEditableMaterial({ entityId, entityType, mimeType });
        break;
      default:
        assert.fail('invalid type');
    }

    this.editableEntities[entityId] = editableEntity;
    editableEntity.on(EditableEntityEvents.EntityUpdated, () => this.emit(EventNames.entityUpdated, editableEntity!));

    return editableEntity;
  }

  private createEditableMaterial({ mimeType, entityId }: EntityLocator) {
    assert(mimeType, 'no mimeType');

    let editableEntity: EditableEntity | null = null;

    if (mimeType.startsWith('image')) {
      editableEntity = new EditableImage(entityId);
    } else if (mimeType === 'application/pdf') {
      editableEntity = new EditablePdf(entityId);
    } else if (mimeType === 'text/html') {
      editableEntity = new EditableHtml(entityId);
    }

    assert(editableEntity, `can not create editor for ${mimeType}`);

    return editableEntity;
  }

  private getEditable(id: EntityId) {
    return this.editableEntities[id];
  }

  refresh(id: EntityId) {
    this.getEditable(id)?.init();
  }

  getOrCreateEditable(locator: EditableEntityLocator) {
    const entity = this.getEditable(locator.entityId);
    return entity || this.createEditableEntity(locator);
  }
}
