import assert from 'assert';

import { EntityId, EntityLocator, EntityTypes } from '#domain/shared/model/entity';
import { EventNames as EditorEvents, default as Editor } from '#domain/client/app/model/abstract/Editor';
import { EventNames as EditableEvents, type default as EditableEntity } from '../abstract/Editable';
import { MimeTypes } from '#domain/shared/model/file';

import EditableNote from '../note/Editable';
import EditablePdf from '../material/editable/EditablePdf';
import EditableMaterial from '../material/editable/EditableMaterial';

import NoteEditor from '../note/Editor';
import PdfEditor from '../material/editor/PdfEditor';
import HtmlEditor from '../material/editor/HtmlEditor';
import ImageEditor from '../material/editor/ImageEditor';
import UnknownEditor from '../material/editor/UnknownEditor';

import type Tile from './Tile';

export default class EditorFactory {
  private readonly editablePool: Record<EntityId, EditableEntity> = {};
  private readonly editorsPool: Record<EntityId, Set<Editor>> = {};

  private createEditableEntity({ entityId, entityType }: EntityLocator, mimeType?: string) {
    let editableEntity = this.editablePool[entityId];

    if (editableEntity) {
      return editableEntity;
    }

    switch (entityType) {
      case EntityTypes.Note:
        editableEntity = new EditableNote(entityId);
        break;
      case EntityTypes.Material:
        assert(mimeType, 'mimeType must be specified when creating material editor');
        editableEntity = this.createEditableMaterial({ entityId, mimeType });
        break;
      default:
        assert.fail(`unsupported entity type: ${entityType}`);
    }

    editableEntity.on(EditableEvents.Destroyed, () => {
      delete this.editablePool[entityId];
    });

    this.editablePool[entityId] = editableEntity;
    return editableEntity;
  }

  public createEditor(tile: Tile, locator: EntityLocator, mimeType?: string) {
    const editable = this.createEditableEntity(locator);

    let editor: Editor;

    if (editable instanceof EditableNote) {
      editor = new NoteEditor(editable, tile);
    } else if (editable instanceof EditableMaterial) {
      assert(mimeType, 'mimeType must be specified when creating material editor');
      editor = this.createMaterialEditor(editable, tile, mimeType);
    } else {
      editor = new Editor(editable, tile);
    }

    this.editorsPool[locator.entityId] ||= new Set();
    this.editorsPool[locator.entityId]!.add(editor);

    editor.on(EditorEvents.Destroy, () => {
      this.handleEditorDestroyed(editor);
    });

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    const entityId = editor.entityLocator.entityId;
    const editors = this.editorsPool[entityId];
    assert(editors);

    editors.delete(editor);

    if (editors.size === 0) {
      delete this.editorsPool[entityId];
      this.editablePool[entityId]!.destroy();
    }
  }

  private createEditableMaterial({ mimeType, entityId }: { entityId: EntityId; mimeType: string }) {
    let editableEntity: EditableEntity | null = null;

    if (mimeType === MimeTypes.PDF) {
      editableEntity = new EditablePdf(entityId);
    } else {
      editableEntity = new EditableMaterial(entityId);
    }

    return editableEntity;
  }

  private createMaterialEditor(editable: EditableMaterial, tile: Tile, mimeType: string) {
    if (editable instanceof EditablePdf) {
      return new PdfEditor(editable, tile);
    }

    if (mimeType === MimeTypes.HTML) {
      return new HtmlEditor(editable, tile);
    }

    if (mimeType.startsWith('image')) {
      return new ImageEditor(editable, tile);
    }

    return new UnknownEditor(editable, tile);
  }
}
