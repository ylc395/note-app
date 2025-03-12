import { action, observable, runInAction } from 'mobx';
import assert from 'assert';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { NewNoteDTO, NoteTypes, NoteVO } from '#domain/shared/model/note';
import DomainEventBus from '../EventBus';

export default class NewNoteEditor {
  constructor({
    type,
    ...options
  }: {
    type: NoteTypes;
    onReset: (newNote?: NoteVO) => void;
    onInit: (value: NonNullable<NewNoteEditor['value']>) => void;
  }) {
    this.type = type;
    this.options = options;
  }

  private readonly type;

  private readonly options;

  private readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  @observable.ref public accessor value: Pick<NewNoteDTO, 'parentId' | 'title'> | undefined;

  @observable public accessor isSubmitting = false;

  @observable public accessor isAutoSubmit = false;

  @action
  public init(newNote: NonNullable<NewNoteEditor['value']>, autoSubmit?: boolean) {
    this.isAutoSubmit = Boolean(autoSubmit);
    this.value = newNote;
    this.options.onInit(newNote);

    if (autoSubmit) {
      this.submit();
    }
  }

  public async submit(title?: string) {
    runInAction(() => {
      this.isSubmitting = true;
    });
    assert(this.value, 'can not submit');

    const newNote = await this.remote.note.create.mutate({
      type: this.type,
      ...this.value,
      title,
    });

    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);

    runInAction(() => {
      this.reset(newNote);
      this.isSubmitting = false;
    });
  }

  @action
  public reset(newNote?: NoteVO) {
    this.value = undefined;
    this.options.onReset(newNote);
  }
}
