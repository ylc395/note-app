import assert from 'assert';

import { EntityLocator, EntityTypes } from '#domain/client/shared/model/entity';
import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor from '../note/editor/BaseEditor';
import PdfEditor from '../note/editor/PdfEditor';
import HtmlEditor from '../note/editor/HtmlEditor';
import ImageEditor from '../note/editor/ImageEditor';
import UnknownEditor from '../note/editor/UnknownEditor';
import type Tile from './Tile';

export default class EditorFactory {
  private readonly editorsMap: Record<Editor['id'], Editor> = {};

  public create(tile: Tile, { entityId, entityType, mimeType }: EntityLocator) {
    assert(entityType === EntityTypes.Note, `can not create editor for entityType: ${entityType}`);

    let editor;

    if (!mimeType) {
      editor = new BaseEditor({ entityId, tile });
    } else if (mimeType === MimeTypes.PDF) {
      editor = new PdfEditor({ entityId, tile });
    } else if (mimeType === MimeTypes.HTML) {
      editor = new HtmlEditor({ entityId, tile });
    } else if (mimeType.startsWith('image')) {
      editor = new ImageEditor({ entityId, tile });
    } else {
      editor = new UnknownEditor({ entityId, tile });
    }

    this.editorsMap[editor.id] = editor;
    editor.events.on(Editor.eventNames.Destroy, this.handleEditorDestroyed.bind(this));

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    delete this.editorsMap[editor.id];
  }

  public get(id: Editor['id']) {
    return this.editorsMap[id];
  }
}
