import assert from 'assert';

import { EntityId, EntityLocator, EntityTypes } from '#domain/client/shared/model/entity';
import Editor from '#domain/client/app/model/abstract/Editor';
import { MimeTypes } from '#domain/shared/model/file';

import NoteEditor from '../note/Editor';
import PdfEditor from '../material/editor/PdfEditor';
import HtmlEditor from '../material/editor/HtmlEditor';
import ImageEditor from '../material/editor/ImageEditor';
import UnknownEditor from '../material/editor/UnknownEditor';

import type Tile from './Tile';

export default class EditorFactory {
  private readonly editorsPool: Record<EntityId, Set<Editor>> = {};

  private readonly editorsMap: Record<Editor['id'], Editor> = {};

  public create(tile: Tile, { entityId, entityType, mimeType }: EntityLocator) {
    let editor: Editor;

    if (entityType === EntityTypes.Note) {
      editor = new NoteEditor(entityId, tile);
    } else if (entityType === EntityTypes.Material) {
      assert(mimeType, 'mimeType must be specified when creating material editor');
      editor = this.createMaterialEditor(entityId, tile, mimeType);
    } else {
      assert.fail(`can not create editor for ${entityType}`);
    }

    this.editorsPool[entityId] ||= new Set();
    this.editorsPool[entityId]!.add(editor);
    this.editorsMap[editor.id] = editor;

    editor.events.on(Editor.eventNames.Destroy, this.handleEditorDestroyed.bind(this, editor));

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    const entityId = editor.entityLocator.entityId;
    const editors = this.editorsPool[entityId];
    assert(editors);

    editors.delete(editor);
    delete this.editorsMap[editor.id];

    if (editors.size === 0) {
      delete this.editorsPool[entityId];
    }
  }

  private createMaterialEditor(entityId: EntityId, tile: Tile, mimeType: string) {
    if (mimeType === MimeTypes.PDF) {
      return new PdfEditor(entityId, tile);
    }

    if (mimeType === MimeTypes.HTML) {
      return new HtmlEditor(entityId, tile);
    }

    if (mimeType.startsWith('image')) {
      return new ImageEditor(entityId, tile);
    }

    return new UnknownEditor(entityId, tile);
  }

  public getEditorById(id: Editor['id']) {
    return this.editorsMap[id];
  }
}
