import { makeObservable, computed, observable, runInAction } from 'mobx';

import type { NoteVO, NoteBodyVO, NoteBodyDTO } from 'interface/Note';
import BaseEditor from './BaseEditor';

export default class NoteEditor extends BaseEditor {
  @observable.ref note?: NoteVO;
  @observable noteBody?: NoteBodyVO;

  constructor(readonly entityId: NoteVO['id']) {
    super();
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

  async updateNoteBody(body: unknown) {
    await this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, JSON.stringify(body));
  }
}
