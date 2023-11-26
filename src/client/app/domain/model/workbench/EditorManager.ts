import { singleton } from 'tsyringe';

import { Emitter } from 'strict-event-emitter';
import assert from 'assert';
import { type EntityLocator, type EntityId, type EditableEntityLocator, EntityTypes } from 'model/entity';

import { type default as EditableEntity, EventNames as EditableEntityEvents } from 'model/abstract/EditableEntity';
import EditableNote from 'model/note/Editable';
import EditablePdf from 'model/material/editable/EditablePdf';
import EditableHtml from 'model/material/editable/EditableHtml';
import EditableImage from 'model/material/editable/EditableImage';

import { type default as Editor, EventNames as EditorEvents } from 'model/abstract/Editor';
import type MaterialEditor from 'model/material/editable/EditableMaterial';
import NoteEditor from 'model/note/Editor';
import PdfEditor from 'model/material/editor/PdfEditor';
import HtmlEditor from 'model/material/editor/HtmlEditor';
import ImageEditor from 'model/material/editor/ImageEditor';

import type Tile from './Tile';

export enum EventNames {
  EditorFocus = 'editorManager.editorFocus',
  entityUpdated = 'editorManager.entityUpdated',
}

type Events = {
  [EventNames.EditorFocus]: [Editor];
  [EventNames.entityUpdated]: [EditableEntity];
};

@singleton()
export default class EditorManager extends Emitter<Events> {
  private readonly editableEntities: Record<EntityId, EditableEntity> = {};

  private readonly editors = new Map<EditableEntity, Set<Editor>>();

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

    let editor: MaterialEditor | null = null;

    if (mimeType.startsWith('image')) {
      editor = new EditableImage(entityId);
    } else if (mimeType === 'application/pdf') {
      editor = new EditablePdf(entityId);
    } else if (mimeType === 'text/html') {
      editor = new EditableHtml(entityId);
    }

    assert(editor, `can not create editor for ${mimeType}`);

    return editor;
  }

  createEditor(entity: EditableEntityLocator, tile: Tile) {
    const editableEntity = this.createEditableEntity(entity);
    let editor: Editor | undefined;

    if (editableEntity instanceof EditableNote) {
      editor = new NoteEditor(editableEntity, tile);
    }

    if (editableEntity instanceof EditablePdf) {
      editor = new PdfEditor(editableEntity, tile);
    }

    if (editableEntity instanceof EditableHtml) {
      editor = new HtmlEditor(editableEntity, tile);
    }

    if (editableEntity instanceof EditableImage) {
      editor = new ImageEditor(editableEntity, tile);
    }

    assert(editor, 'invalid editor');

    editor.once(EditorEvents.Destroyed, () => this.handleEditorDestroyed(editableEntity, editor!));
    editor.on(EditorEvents.Focus, () => this.emit(EventNames.EditorFocus, editor!));

    const editorSet = this.editors.get(editableEntity);

    if (editorSet) {
      editorSet.add(editor);
    } else {
      this.editors.set(editableEntity, new Set([editor]));
    }

    return editor;
  }

  private handleEditorDestroyed(editable: EditableEntity, editor: Editor) {
    const editorSet = this.editors.get(editable)!;
    editorSet.delete(editor);

    if (editorSet.size === 0) {
      this.editors.delete(editable);
      delete this.editableEntities[editable.id];
      editable.destroy();
    }
  }
}
