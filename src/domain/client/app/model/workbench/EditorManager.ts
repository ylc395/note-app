import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import { MimeTypes } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';

import PdfEditor from '../note/editor/PdfEditor';
import HtmlEditor from '../note/editor/HtmlEditor';
import ImageEditor from '../note/editor/ImageEditor';
import UnknownEditor from '../note/editor/UnknownEditor';
import MarkdownEditor from '../note/editor/MarkdownEditor';
import DomainEventBus, { type UpdatedEvent } from '../note/EventBus';
import type Tile from './Tile';

export interface EditorDTO {
  entityId: NoteVO['id'];
  mimeType: NoteVO['mimeType'];
  title?: NoteVO['title'];
}

export default class EditorManager {
  constructor() {
    this.domainEventBus.on(DomainEventBus.eventNames.Updated, this.handleNoteUpdate.bind(this));
    // this.domainEventBus.on(DomainEventBus.eventNames.Deleted, this.handleNoteDeleted.bind(this));
  }
  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly editorsMap = new Map<Editor['id'], Editor>();

  private readonly noteEditorsMap = new Map<NoteVO['id'], Editor[]>();

  public create(tile: Tile, { entityId, mimeType }: EditorDTO) {
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

    const noteEditors = this.noteEditorsMap.get(entityId) || [];
    noteEditors.push(editor);
    this.noteEditorsMap.set(entityId, noteEditors);
    this.editorsMap.set(editor.id, editor);

    editor.events.on(Editor.eventNames.Destroy, this.handleEditorDestroyed.bind(this));

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    this.editorsMap.delete(editor.id);
  }

  private handleNoteUpdate({ id, payload: note, source }: UpdatedEvent) {
    const editors = this.noteEditorsMap.get(id);

    if (!editors) {
      return;
    }

    for (const editor of editors) {
      if (!(source instanceof Editor)) {
        editor.value.setData((origin) => origin && { ...origin, ...note });
      }

      if (note.parentId !== undefined) {
        editor.path.invalidate();
      }
    }
  }

  public get(id: Editor['id']) {
    return this.editorsMap.get(id);
  }
}
