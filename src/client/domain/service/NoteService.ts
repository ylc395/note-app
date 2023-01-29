import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction } from 'mobx';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { NoteDTO, NoteVO } from 'interface/Note';

@singleton()
export default class NoteService {
  readonly #remote: Remote = container.resolve(remoteToken);
  @observable notes: NoteVO[] = [];

  constructor() {
    makeObservable(this);
  }

  readonly createNote = async () => {
    await this.#remote.post<NoteDTO>('/notes', {});
    await this.fetchNotes();
  };

  readonly fetchNotes = async () => {
    const { body } = await this.#remote.get<void, NoteVO[]>('/notes');
    runInAction(() => {
      this.notes = body;
    });
  };
}