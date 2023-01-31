import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction } from 'mobx';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { NoteDTO, NoteVO } from 'interface/Note';

import WorkbenchService, { WorkbenchEvents } from './WorkbenchService';

@singleton()
export default class NoteService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly #workbench = container.resolve(WorkbenchService);
  @observable notes: NoteVO[] = [];

  constructor() {
    makeObservable(this);
    this.#workbench.on(WorkbenchEvents.NoteUpdated, this.#updateNote);
  }

  readonly #updateNote = (note: NoteVO) => {
    const targetNote = this.notes.find(({ id }) => id === note.id);

    if (targetNote) {
      runInAction(() => {
        Object.assign(targetNote, note);
      });
    }
  };

  readonly createNote = async () => {
    await this.#remote.post<NoteDTO>('/notes', { title: 'new note' });
    await this.fetchNotes();
  };

  readonly fetchNotes = async () => {
    const { body } = await this.#remote.get<void, NoteVO[]>('/notes');
    runInAction(() => {
      this.notes = body;
    });
  };
}
