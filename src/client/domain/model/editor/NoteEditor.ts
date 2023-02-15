import { makeObservable, computed, observable, runInAction } from 'mobx';
import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import { buildIndex } from 'utils/collection';
import {
  normalizeTitle,
  type NoteVO,
  type NoteBodyVO,
  type NoteBodyDTO,
  type NotePath,
  type NotesDTO,
} from 'interface/Note';
import type Window from 'model/Window';

import EntityEditor from './EntityEditor';
import NoteService, { NoteEvents } from 'service/NoteService';

export default class NoteEditor extends EntityEditor {
  @observable note?: NoteVO;
  @observable noteBody?: NoteBodyVO;
  @observable breadcrumb?: NotePath;
  private readonly noteService = container.resolve(NoteService);

  constructor(protected readonly window: Window, readonly entityId: NoteVO['id']) {
    super(window, entityId);
    makeObservable(this);
    this.loadBreadcrumb();
    this.loadNote();
    this.noteService.on(NoteEvents.Updated, this.handleNotesUpdate);
  }

  private readonly handleNotesUpdate = (notes: NotesDTO) => {
    const notesIndex = buildIndex(notes);

    if (this.note && notesIndex[this.entityId]) {
      Object.assign(this.note, notesIndex[this.entityId]);
    }

    if (this.breadcrumb) {
      const tryLoadBreadcrumb = (id: NoteVO['id']) => {
        const note = notesIndex[id];

        if (!note) {
          return;
        }

        if (typeof note.icon !== 'undefined' || typeof note.parentId !== 'undefined') {
          this.loadBreadcrumb();
          return true;
        }
      };

      for (const { id, siblings } of this.breadcrumb) {
        if (tryLoadBreadcrumb(id) || siblings.some(({ id }) => tryLoadBreadcrumb(id))) {
          return;
        }
      }
    }
  };

  @computed get title() {
    if (!this.note) {
      return '';
    }

    return normalizeTitle(this.note);
  }

  private async loadBreadcrumb() {
    const { body: notePath } = await this.remote.get<void, NotePath>(`/notes/${this.entityId}/tree-path`);

    runInAction(() => {
      this.breadcrumb = notePath;
    });
  }

  private async loadNote() {
    const { body: note } = await this.remote.get<void, NoteVO>(`/notes/${this.entityId}`);
    const { body: noteBody } = await this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`);

    runInAction(() => {
      this.note = note;
      this.noteBody = noteBody;
    });
  }

  readonly save = debounce(async (body: unknown) => {
    const jsonStr = JSON.stringify(body);
    runInAction(() => {
      this.noteBody = jsonStr;
    });

    await this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, jsonStr);
  }, 500);

  saveTitle(title: string) {
    runInAction(() => {
      if (!this.note) {
        throw new Error('no note');
      }
      this.note.title = title;
    });

    this.syncTitle(title);
  }

  private readonly syncTitle = debounce(async (title: string) => {
    this.window.notifyEntityUpdated(this);
    await this.remote.patch(`/notes/${this.entityId}`, { title });
  }, 500);
}
