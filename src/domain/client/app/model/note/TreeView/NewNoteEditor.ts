import { action, observable } from 'mobx';
import assert from 'assert';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { NoteVO } from '#domain/shared/model/note';
import DomainEventBus from '../EventBus';

export default class NewNoteEditor {
  private readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  @observable.ref public accessor newNote: NoteVO | undefined;

  @action
  public set(note: NoteVO) {
    this.newNote = note;
  }

  public async submit(title: string) {
    assert(this.newNote, 'can not submit');

    await this.remote.note.updateOne.mutate([this.newNote.id, { title }]);
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, { ...this.newNote, title });
    this.cancel();
  }

  @action
  public cancel() {
    this.newNote = undefined;
  }
}
