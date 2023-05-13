import { container } from 'tsyringe';
import debounce from 'lodash/debounce';

import type { NoteVO, NoteBodyVO, NoteDTO, NoteBodyDTO } from 'interface/Note';
import { EntityTypes } from 'interface/entity';
import { token as remoteToken } from 'infra/remote';
import type Tile from 'model/workbench/Tile';
import NoteEditor, { Events as NoteEditorEvents } from 'model/note/Editor';
import NoteService from 'service/NoteService';

import type EditorService from './index';

function load(noteId: NoteVO['id']) {
  const remote = container.resolve(remoteToken);

  return Promise.all([
    remote.get<void, NoteVO>(`/notes/${noteId}`),
    remote.get<void, NoteBodyVO>(`/notes/${noteId}/body`),
  ]).then(([{ body: metadata }, { body }]) => ({ metadata, body }));
}

function updateNote(note: NoteVO) {
  const remote = container.resolve(remoteToken);
  return remote.patch<NoteDTO>(`/notes/${note.id}`, note);
}

function updateBody(noteId: NoteVO['id'], body: string, isImportant?: true) {
  const remote = container.resolve(remoteToken);
  return remote.put<NoteBodyDTO>(`/notes/${noteId}/body`, { content: body, isImportant });
}

export default function noteEditorFactory(editorService: EditorService, tile: Tile, noteId: NoteVO['id']) {
  const { noteTree } = container.resolve(NoteService);
  const noteEditor = new NoteEditor(tile, noteId, noteTree);
  const entity = { type: EntityTypes.Note, id: noteId };

  noteEditor
    .on(
      NoteEditorEvents.BodyUpdated,
      debounce((body) => updateBody(noteId, body), 1000),
    )
    .on(NoteEditorEvents.BodyUpdated, (body) => {
      for (const editor of editorService.getEditorsByEntity<NoteEditor>(entity, noteEditor.id)) {
        editor.updateBody(body, false);
      }
    })
    .on(NoteEditorEvents.Updated, debounce(updateNote, 1000))
    .on(NoteEditorEvents.Updated, (note) => {
      noteTree.updateTreeByEntity(note);

      for (const editor of editorService.getEditorsByEntity<NoteEditor>(entity, noteEditor.id)) {
        editor.updateNote(note, false);
      }
    });

  load(noteId).then(noteEditor.loadEntity);

  return noteEditor;
}
