import { makeObservable, computed, action, toJS } from 'mobx';
import debounce from 'lodash/debounce';

import { EntityTypes } from 'interface/entity';
import { normalizeTitle, type NoteVO, type NoteBodyVO, NoteBodyDTO, NoteDTO } from 'interface/Note';
import type Tile from 'model/workbench/Tile';
import Editor, { type CommonEditorEvents, type Breadcrumbs } from 'model/abstract/Editor';
import type NoteTree from './Tree';

export enum Events {
  BodyUpdated = 'noteEditor.updated.body', // not included synced by other editors
}

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

interface NoteEditorEvents extends CommonEditorEvents {
  [Events.BodyUpdated]: [{ content: string; isOriginal: boolean }];
}

export default class NoteEditor extends Editor<Entity, NoteEditorEvents> {
  readonly entityType = EntityTypes.Note;
  constructor(tile: Tile, noteId: NoteVO['id'], private readonly noteTree: NoteTree) {
    super(tile, noteId);
    makeObservable(this);
    this.init();
  }

  private async init() {
    const [{ body: metadata }, { body }] = await Promise.all([
      this.remote.get<void, NoteVO>(`/notes/${this.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`),
    ]);

    this.load({ metadata, body });
  }

  @computed
  get tabView() {
    return {
      title:
        (__ENV__ === 'dev' ? `${this.id} ${this.entityId.slice(0, 3)} ` : '') +
        (this.entity ? normalizeTitle(this.entity.metadata) : ''),
      icon: this.entity?.metadata.icon || null,
    };
  }

  @computed
  get breadcrumbs() {
    const result: Breadcrumbs = [];
    let note = this.noteTree.getNode(this.entityId, true)?.entity;
    const noteToBreadcrumb = (note: NoteVO) => ({
      id: note.id,
      title: normalizeTitle(note),
      icon: note.icon || undefined,
    });

    while (note) {
      result.unshift({
        ...noteToBreadcrumb(note),
        siblings: this.noteTree.getSiblings(note.id).map(({ entity: note }) => noteToBreadcrumb(note)),
      });

      note = note.parentId ? this.noteTree.getNode(note.parentId).entity : undefined;
    }

    return result;
  }

  @action
  async updateBody(body: string, isOriginal: boolean) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.entity.body = body;
    this.emit(Events.BodyUpdated, { content: body, isOriginal });

    if (isOriginal) {
      this.uploadBody(body);
      const editors = this.editorManager.getEditorsByEntity<NoteEditor>(
        { id: this.entityId, type: this.entityType },
        this.id,
      );

      for (const editor of editors) {
        editor.updateBody(body, false);
      }
    }
  }

  private readonly uploadBody = debounce((body: string) => {
    this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, { content: body });
  }, 800);

  @action
  updateNote(note: Partial<NoteVO>, isOriginal: boolean) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    if (note.id && note.id !== this.entity.metadata.id) {
      throw new Error('wrong id');
    }

    Object.assign(this.entity.metadata, note);

    const metadata = toJS(this.entity.metadata);

    if (isOriginal) {
      this.uploadNote(metadata);
      this.noteTree.updateTreeByEntity(metadata);

      const editors = this.editorManager.getEditorsByEntity<NoteEditor>(
        { id: this.entityId, type: this.entityType },
        this.id,
      );

      for (const editor of editors) {
        editor.updateNote(metadata, false);
      }
    }
  }

  private readonly uploadNote = debounce((note: Partial<NoteVO>) => {
    this.remote.patch<NoteDTO>(`/notes/${note.id}`, note);
  }, 1000);
}
