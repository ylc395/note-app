import { action, observable, runInAction, toJS } from 'mobx';
import assert from 'assert';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import container from '#utils/singletonContainer';
import type { NewNoteDTO } from '#domain/shared/model/note';
import DomainEventBus from '../EventBus';

export default class NewNoteForm {
  constructor({
    parentId,
    title,
    type,
    isAutoSubmit,
    ...options
  }: {
    parentId?: NewNoteDTO['parentId'];
    title?: NewNoteDTO['title'];
    type: NewNoteDTO['type'];
    isAutoSubmit?: boolean;
    onCancel?: () => void;
    onFinish?: () => void;
  }) {
    runInAction(() => {
      this.value = { parentId, title, type };
      this.isAutoSubmit = isAutoSubmit ?? false;
    });

    this.options = options;

    if (isAutoSubmit) {
      this.submit();
    }
  }

  private readonly options;

  private readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  @observable public accessor value!: Pick<NewNoteDTO, 'parentId' | 'title' | 'type'>;

  @observable public accessor isSubmitting = false;

  @observable public accessor isAutoSubmit = false;

  @action
  public setTitle(value: string) {
    this.value.title = value;
  }

  public async submit() {
    runInAction(() => {
      this.isSubmitting = true;
    });

    const newNote = await this.remote.note.create.mutate(toJS(this.value));
    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);

    runInAction(() => {
      this.isSubmitting = false;
    });

    this.options.onFinish?.();
  }

  public cancel() {
    assert(!this.isSubmitting, 'can not cancel when submitting');
    this.options.onCancel?.();
    this.options.onFinish?.();
  }
}
