import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';

import { NoteTypes, type NewNoteDTO } from '#domain/shared/model/note';
import Form from '#domain/client/shared/model/abstract/Form';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import DomainEventBus from './EventBus';
import type { FileDTO } from '#domain/shared/model/file';
import { getHash } from '#utils/file';

type MaterialFormField = Pick<NewNoteDTO, 'title' | 'body' | 'icon' | 'sourceUrl'>;

type File = Pick<FileDTO, 'mimeType' | 'path'> & { data: ArrayBuffer };

export default class MaterialForm extends Form<MaterialFormField> {
  constructor(private formOptions: { onSubmit: () => void; parentId?: NewNoteDTO['parentId'] }) {
    super();
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly remote = container.resolve(rpcToken);

  @observable.ref private accessor file: (File & { hash: string }) | undefined;

  public readonly duplicatedNotesQuery = createQuery(
    () => this.remote.note.query.query({ fileHash: this.file!.hash }),
    {
      options: () => ({
        queryKey: ['notes', { fileHash: this.file?.hash }],
        enabled: Boolean(this.file),
      }),
    },
  );

  @action
  public async handleFileSelected(file?: File) {
    if (!file) {
      this.file = undefined;
      return;
    }

    const hash = await getHash(file.data);

    runInAction(() => {
      this.file = { ...file, hash };
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
      type: NoteTypes.Material,
      fileId: newFile.id,
      parentId: this.formOptions.parentId,
      ...this.get(),
    });

    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.formOptions.onSubmit();
  }

  public destroy() {
    this.duplicatedNotesQuery.destroy();
  }
}
