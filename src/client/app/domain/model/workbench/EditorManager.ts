import {
  EntityTypes,
  type EntityLocator,
  type EntityId,
  EditableEntityTypes,
  EditableEntityLocator,
} from 'model/entity';

import { Events as EditableEntityEvents, type default as Editable } from 'model/abstract/Editable';
import EditableNote from 'model/note/Editable';
import EditablePdf from 'model/material/editable/EditablePdf';
import EditableHtml from 'model/material/editable/EditableHtml';
import EditableImage from 'model/material/editable/EditableImage';

import { Events as EditorEvents, type default as Editor } from 'model/abstract/Editor';
import NoteEditor from 'model/note/Editor';
import type MaterialEditor from 'model/material/editable/Editable';
import PdfEditor from 'model/material/editor/PdfEditor';
import HtmlEditor from 'model/material/editor/HtmlEditor';
import ImageEditor from 'model/material/editor/ImageEditor';

import type Tile from './Tile';

export default class EditorManager {
  private readonly editableEntities: Record<EditableEntityTypes, Record<EntityId, Editable>> = {
    [EntityTypes.Note]: {},
    [EntityTypes.Material]: {},
  };

  private readonly editors = new Map<Editable, Set<Editor>>();

  getEditableEntity({ entityType, entityId }: EditableEntityLocator) {
    return this.editableEntities[entityType]?.[entityId];
  }

  private createEditableEntity(tile: Tile, { entityId, entityType, mimeType }: EditableEntityLocator) {
    let editor = this.getEditableEntity({ entityId, entityType, mimeType });

    if (editor) {
      return editor;
    }

    switch (entityType) {
      case EntityTypes.Note:
        editor = new EditableNote(entityId);
        break;
      case EntityTypes.Material:
        editor = this.createEditableMaterial(tile, { entityId, entityType, mimeType });
        break;
      default:
        throw new Error('invalid type');
    }

    editor.once(EditableEntityEvents.Destroyed, () => delete this.editableEntities[entityType]![entityId]);
    this.editableEntities[entityType]![entityId] = editor;
    return editor;
  }

  private createEditableMaterial(tile: Tile, { mimeType, entityId }: EntityLocator) {
    if (!mimeType) {
      throw new Error('no mimeType');
    }

    let editor: MaterialEditor | null = null;

    if (mimeType.startsWith('image')) {
      editor = new EditableImage(entityId);
    } else if (mimeType === 'application/pdf') {
      editor = new EditablePdf(entityId);
    } else if (mimeType === 'text/html') {
      editor = new EditableHtml(entityId);
    }

    if (!editor) {
      throw new Error('can not create editor');
    }

    return editor;
  }

  createEditor(tile: Tile, entity: EditableEntityLocator) {
    const editableEntity = this.createEditableEntity(tile, entity);
    let editor: Editor | undefined;

    if (editableEntity instanceof EditableNote) {
      editor = new NoteEditor(tile, editableEntity);
    }

    if (editableEntity instanceof EditablePdf) {
      editor = new PdfEditor(tile, editableEntity);
    }

    if (editableEntity instanceof EditableHtml) {
      editor = new HtmlEditor(tile, editableEntity);
    }

    if (editableEntity instanceof EditableImage) {
      editor = new ImageEditor(tile, editableEntity);
    }

    if (!editor) {
      throw new Error('invalid editor');
    }

    editor.once(EditorEvents.Destroyed, () => this.handleEditorDestroyed(editor!));
    const viewSet = this.editors.get(editableEntity);

    if (viewSet) {
      viewSet.add(editor);
    } else {
      this.editors.set(editableEntity, new Set([editor]));
    }

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    const viewSet = this.editors.get(editor.editable)!;
    viewSet.delete(editor);

    if (viewSet.size === 0) {
      this.editors.delete(editor.editable);
      editor.editable.destroy();
    }
  }
}
