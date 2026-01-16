import Editor, { type Options } from '#domain/client/app/model/note/editor/BaseEditor';
import { MimeTypes } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';

import PdfEditor from '../note/editor/PdfEditor';
import HtmlEditor from '../note/editor/HtmlEditor';
import ImageEditor from '../note/editor/ImageEditor';
import UnknownEditor from '../note/editor/UnknownEditor';
import MarkdownEditor from '../note/editor/MarkdownEditor';
import type Tile from './Tile';

export interface EditorDTO extends Options {
  mimeType: NoteVO['mimeType'];
}

export default class EditorFactory {
  constructor() {
    // this.domainEventBus.on(DomainEventBus.eventNames.Deleted, this.handleNoteDeleted.bind(this));
  }

  private readonly editorsMap = new Map<Editor['id'], Editor>();

  private readonly noteEditorsMap = new Map<NoteVO['id'], Editor[]>();

  public create(tile: Tile, config: EditorDTO) {
    let editor;
    const { mimeType } = config;

    if (!mimeType) {
      editor = new MarkdownEditor(tile, config);
    } else if (mimeType === MimeTypes.PDF) {
      editor = new PdfEditor(tile, config);
    } else if (mimeType === MimeTypes.HTML) {
      editor = new HtmlEditor(tile, config);
    } else if (mimeType.startsWith('image')) {
      editor = new ImageEditor(tile, { ...config, mimeType });
    } else {
      editor = new UnknownEditor(tile, { ...config, mimeType });
    }

    const noteEditors = this.noteEditorsMap.get(config.noteId) || [];
    noteEditors.push(editor);
    this.noteEditorsMap.set(config.noteId, noteEditors);
    this.editorsMap.set(editor.id, editor);

    editor.events.on(Editor.eventNames.Destroy, this.handleEditorDestroyed.bind(this));

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    this.editorsMap.delete(editor.id);
  }

  public get(id: Editor['id']) {
    return this.editorsMap.get(id);
  }
}
