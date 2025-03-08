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

  @observable.ref public accessor value: Pick<NewNoteDTO, 'parentId' | 'title'> | undefined;

  @action
  public async create(newNote: NonNullable<NewNoteEditor['value']>, submit?: boolean) {
    if (this.value) {
      await this.submit();
    }

    this.value = newNote;

    if (submit) {
      this.submit();
    }
  }

  public async submit(title?: string) {
    assert(this.value, 'can not submit');

    const newNote = await this.remote.note.create.mutate({
      type: this.type,
      ...this.value,
      title,
    });

    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.reset();
  }

  @action
  public reset() {
    this.value = undefined;
  }
}
