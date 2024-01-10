import assert from 'assert';
import { singleton } from 'tsyringe';

import { type EntityLocator, type EntityId, EntityTypes } from '@domain/app/model/entity';
import type { default as EditableEntity, EditableEntityLocator } from '@domain/app/model/abstract/EditableEntity';
import type Editor from '@domain/app/model/abstract/Editor';
import EditableNote from '@domain/app/model/note/Editable';
import EditablePdf from '@domain/app/model/material/editable/EditablePdf';
import EditableHtml from '@domain/app/model/material/editable/EditableHtml';
import EditableImage from '@domain/app/model/material/editable/EditableImage';
import type Tile from './Tile';

@singleton()
export default class EditableEntityManager {
  private readonly editableEntities: Record<EntityId, EditableEntity> = {};
  private readonly editorsCount: Record<EditableEntity['entityId'], number> = {};

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

    return editableEntity;
  }

  public createEditor(tile: Tile, locator: EditableEntityLocator) {
    const editable = this.editableEntities[locator.entityId] || this.createEditableEntity(locator);

    if (typeof this.editorsCount[locator.entityId] !== 'number') {
      this.editorsCount[locator.entityId] = 0;
    }
    this.editorsCount[locator.entityId] += 1;

    return editable.createEditor(tile);
  }

  public destroyEditor({ entityLocator: { entityId } }: Editor) {
    assert(typeof this.editorsCount[entityId] === 'number');
    this.editorsCount[entityId] -= 1;

    if (this.editorsCount[entityId] === 0) {
      this.editableEntities[entityId]!.destroy();
      delete this.editableEntities[entityId];
      delete this.editorsCount[entityId];
    }
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
}
