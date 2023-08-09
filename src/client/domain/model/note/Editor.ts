import { makeObservable, action, toJS } from 'mobx';
import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import { EntityTypes } from 'model/entity';
import type { NoteVO, NoteBodyVO, NoteBodyDTO, NoteDTO } from 'model/note';
import type Tile from 'model/workbench/Tile';
import Editor from 'model/abstract/Editor';
import NoteTree from 'model/note/Tree';

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

export default class NoteEditor extends Editor<Entity> {
  readonly entityType = EntityTypes.Note;
  readonly noteTree = container.resolve(NoteTree);
  constructor(tile: Tile, noteId: NoteVO['id']) {
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
    this.noteTree.updateTree(metadata);
  }

  private readonly uploadNote = debounce((note: Partial<NoteVO>) => {
    this.remote.patch<NoteDTO>(`/notes/${note.id}`, note);
  }, 1000);
}
