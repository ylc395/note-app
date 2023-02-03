import { makeObservable, computed, observable, runInAction } from 'mobx';
import debounce from 'lodash/debounce';

import { type NoteVO, type NoteBodyVO, type NoteBodyDTO, normalizeTitle } from 'interface/Note';
import type Window from 'model/Window';
import EntityEditor from './EntityEditor';

export default class NoteEditor extends EntityEditor {
  @observable note?: NoteVO;
  @observable noteBody?: NoteBodyVO;

  constructor(protected readonly window: Window, readonly entityId: NoteVO['id']) {
    super(window, entityId);
    makeObservable(this);
    this.load();
  }

  @computed get title() {
    if (!this.note) {
      return '';
    }

    return normalizeTitle(this.note);
  }

  private async load() {
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
