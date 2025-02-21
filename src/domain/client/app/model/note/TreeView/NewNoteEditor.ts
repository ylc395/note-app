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

  @observable.ref public accessor newNote: Required<Pick<NewNoteDTO, 'parentId'>> | undefined;

  @action
  public init(newNote: NonNullable<NewNoteEditor['newNote']>) {
    this.newNote = newNote;
  }

  public async submit(title: string) {
    assert(this.newNote, 'can not submit');

    const newNote = await this.remote.note.create.mutate({
      title,
      type: this.type,
      ...this.newNote,
    });

    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.cancel();
  }

  @action
  public cancel() {
    this.newNote = undefined;
  }
}
