import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';

import type { NewNoteDTO, NoteVO } from '#domain/shared/model/note';
import Form from '#domain/client/shared/model/abstract/Form';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import type { FileDTO } from '#domain/shared/model/file';
import { getHash } from '#utils/file';

type MaterialFormField = Pick<NewNoteDTO, 'title' | 'body' | 'icon' | 'sourceUrl'>;

type File = Pick<FileDTO, 'mimeType' | 'path'> & { data: ArrayBuffer; name: string };

export default class MaterialForm extends Form<MaterialFormField> {
  constructor(private formOptions: { onSubmit: (note: NewNoteDTO) => void; parent?: NoteVO }) {
    super();
  }

  public readonly remote = container.resolve(rpcToken);

  public get parent() {
    return this.formOptions.parent;
  }

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

    this.formOptions.onSubmit({
      fileId: newFile.id,
      parentId: this.formOptions.parent?.id,
      ...this.get(),
    });
  }

  public destroy() {
    this.duplicatedNotesQuery.destroy();
  }
}
