import { makeObservable, action, toJS } from 'mobx';
import debounce from 'lodash/debounce';

import { EntityTypes } from 'interface/entity';
import type { NoteVO, NoteBodyVO, NoteBodyDTO, NoteDTO } from 'interface/Note';
import type Tile from 'model/workbench/Tile';
import Editor from 'model/abstract/Editor';
import type NoteTree from './Tree';

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

export default class NoteEditor extends Editor<Entity> {
  readonly entityType = EntityTypes.Note;
  constructor(tile: Tile, noteId: NoteVO['id'], readonly noteTree: NoteTree) {
    super(tile, noteId);
    makeObservable(this);
  }

  protected async init() {
    const [{ body: metadata }, { body }] = await Promise.all([
      this.remote.get<void, NoteVO>(`/notes/${this.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`),
    ]);

    this.load({ metadata, body });
  }

  @action
  updateBody(body: string) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.entity.body = body;
    this.uploadBody(body);
  }

  private readonly uploadBody = debounce((body: string) => {
    this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, { content: body });
  }, 800);

  @action
  updateNote(note: Partial<NoteVO>) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    if (note.id && note.id !== this.entity.metadata.id) {
      throw new Error('wrong id');
    }

    Object.assign(this.entity.metadata, note);

    const metadata = toJS(this.entity.metadata);
    this.uploadNote(metadata);
    this.noteTree.updateTreeByEntity(metadata);
  }

  private readonly uploadNote = debounce((note: Partial<NoteVO>) => {
    this.remote.patch<NoteDTO>(`/notes/${note.id}`, note);
  }, 1000);
}
