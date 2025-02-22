import { action, observable } from 'mobx';
import assert from 'assert';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { NewNoteDTO, NoteTypes } from '#domain/shared/model/note';
import DomainEventBus from '../EventBus';

export default class NewNoteEditor {
  constructor(private readonly type: NoteTypes) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  @observable.ref public accessor newNote: Pick<NewNoteDTO, 'parentId' | 'title'> | undefined;

  @action
  public async create(newNote: NonNullable<NewNoteEditor['newNote']>, submit?: boolean) {
    if (this.newNote) {
      await this.submit();
    }

    this.newNote = newNote;

    if (submit) {
      this.submit();
    }
  }

  public async submit(title?: string) {
    assert(this.newNote, 'can not submit');

    const newNote = await this.remote.note.create.mutate({
      type: this.type,
      ...this.newNote,
      title,
    });

    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.reset();
  }

  @action
  public reset() {
    this.newNote = undefined;
  }
}
