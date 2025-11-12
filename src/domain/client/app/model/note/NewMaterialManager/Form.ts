import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';

import type { NewNoteDTO, NoteVO } from '#domain/shared/model/note';
import Form from '#domain/client/shared/model/abstract/Form';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import type { FileDTO } from '#domain/shared/model/file';
import { getHash } from '#utils/file';
import type { EntityPath } from '#domain/shared/model/entity';
import DomainEventBus from '../EventBus';

type MaterialFormField = Pick<NewNoteDTO, 'title' | 'body' | 'icon' | 'sourceUrl'>;

type File = Pick<FileDTO, 'mimeType' | 'path'> & { data: ArrayBuffer; name: string };

export default class NewMaterialForm extends Form<MaterialFormField> {
  constructor(private formOptions: { onDestroy?: () => void; onSubmit: (note: NoteVO) => void; path?: EntityPath }) {
    super();
  }

  private readonly eventBus = container.resolve(DomainEventBus);

  public readonly remote = container.resolve(rpcToken);

  @observable.ref private accessor file: (File & { hash: string }) | undefined;

  @observable public accessor hasFile = false;

  public get path() {
    return this.formOptions.path;
  }

  public readonly duplicatedNotesQuery = createQuery(
    () => (this.file ? this.remote.note.query.query({ fileHash: this.file.hash }) : null),
    {
      queryKey: () => ['notes', { fileHash: this.file?.hash }],
    },
  );

  @action
  public async setFile(file?: File) {
    this.hasFile = Boolean(file);

    if (!file) {
      if (this.get('title') === this.file?.name) {
        this.set('title', undefined);
      }

      this.file = undefined;
      return;
    }

    const hash = await getHash(file.data);

    runInAction(() => {
      this.file = {
        ...file,
        hash,
        name: file.name.split('.')[0]!,
      };

      if (!this.get('title')) {
        this.set('title', this.file.name);
      }
    });
  }

  @computed
  public override get isValid() {
    return Boolean(this.file);
  }

  public async submit() {
    assert(this.file, 'no file');

    const newFile = await this.remote.file.upload.mutate({
      ...this.file,
      data: this.file.path ? undefined : this.file.data,
    });

    const newNote = await this.remote.note.create.mutate({
      fileId: newFile.id,
      parentId: last(this.formOptions.path)?.id,
      ...this.get(),
    });

    this.eventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.formOptions.onSubmit(newNote);
  }

  @action
  public destroy() {
    this.duplicatedNotesQuery.destroy();
    this.formOptions.onDestroy?.();
  }
}
