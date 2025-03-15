import assert from 'assert';
import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import { MimeTypes } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';

import PdfEditor from '../note/editor/PdfEditor';
import HtmlEditor from '../note/editor/HtmlEditor';
import ImageEditor from '../note/editor/ImageEditor';
import UnknownEditor from '../note/editor/UnknownEditor';
import type Tile from './Tile';
import MarkdownEditor from '../note/editor/MarkdownEditor';

export default class EditorManager {
  private readonly editorsMap: Record<Editor['id'], Editor> = {};

  private readonly editorTileMap: Record<Editor['id'], Tile['id']> = {};

  public create(tile: Tile, { id: entityId, mimeType }: Pick<NoteVO, 'id' | 'mimeType'>) {
    let editor;

    if (!mimeType) {
      editor = new MarkdownEditor({ entityId, tile });
    } else if (mimeType === MimeTypes.PDF) {
      editor = new PdfEditor({ entityId, tile });
    } else if (mimeType === MimeTypes.HTML) {
      editor = new HtmlEditor({ entityId, tile });
    } else if (mimeType.startsWith('image')) {
      editor = new ImageEditor({ entityId, tile, mimeType });
    } else {
      editor = new UnknownEditor({ entityId, tile, mimeType });
    }

    this.editorsMap[editor.id] = editor;
    editor.events.on(Editor.eventNames.Destroy, this.handleEditorDestroyed.bind(this));

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    delete this.editorsMap[editor.id];
    this.editorTileMap[editor.id] = editor.tile.id;
  }

  public get(id: Editor['id']) {
    return this.editorsMap[id];
  }

  public getAndRemoveTileIdOf(editorId: Editor['id']) {
    const tileId = this.editorTileMap[editorId];
    assert(tileId, 'can not get tileId');

    delete this.editorTileMap[editorId];
    return tileId;
  }
}
