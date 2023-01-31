import { makeObservable, computed, observable, runInAction } from 'mobx';

import type { NoteVO, NoteBodyVO, NoteBodyDTO } from 'interface/Note';
import BaseEditor from './BaseEditor';
import type Window from 'model/Window';

export default class NoteEditor extends BaseEditor {
  @observable note?: NoteVO;
  @observable noteBody?: NoteBodyVO;

  constructor(protected readonly window: Window, readonly entityId: NoteVO['id']) {
    super(window, entityId);
    makeObservable(this);
    this.load();
  }

  @computed get title() {
    return this.note?.title || '';
  }

  private async load() {
    const { body: note } = await this.remote.get<void, NoteVO>(`/notes/${this.entityId}`);
    const { body: noteBody } = await this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`);

    runInAction(() => {
      this.note = note;
      this.noteBody = noteBody;
    });
  }

  async save(body: unknown) {
    const jsonStr = JSON.stringify(body);
    runInAction(() => {
      this.noteBody = jsonStr;
    });

    await this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, jsonStr);
  }

  async saveTitle(title: string) {
    runInAction(() => {
      if (!this.note) {
        throw new Error('no note');
      }
      this.note.title = title;
    });

    await this.remote.patch(`/notes/${this.entityId}`, { title });
    this.window.notifyEntityUpdated(this);
  }
}
