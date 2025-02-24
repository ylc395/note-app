import { observable, runInAction } from 'mobx';
import assert from 'assert';

import { NoteTypes, type NewNoteDTO, type NoteVO } from '#domain/shared/model/note';
import Form from '#domain/client/shared/model/abstract/Form';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { FileDTO, FileVO } from '#domain/shared/model/file';

import DomainEventBus from './EventBus';

type MaterialFormField = Pick<NewNoteDTO, 'title' | 'body' | 'icon' | 'sourceUrl' | 'fileId'>;

export default class MaterialForm extends Form<MaterialFormField> {
  constructor(private formOptions: { onSubmit: () => void }) {
    super({
      fileId: { isRequired: true },
    });
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly remote = container.resolve(rpcToken);

  @observable.ref public accessor duplicatedNotes: NoteVO[] | undefined;

  private file?: FileVO;

  public async uploadFile(file: string | ArrayBuffer, mimeType: string) {
    this.removeTempFile();
    this.set('fileId', undefined);

    const newFile: FileDTO = { mimeType, isTemp: true };
    this.file = await this.remote.file.upload.mutate(
      typeof file === 'string' ? { path: file, ...newFile } : { data: file, ...newFile },
    );

    this.set('fileId', this.file.id);
    const duplicatedNotes = await this.remote.note.query.query({ fileHash: this.file.hash });

    runInAction(() => {
      this.duplicatedNotes = duplicatedNotes;
    });
  }

  private hasSubmit = false;

  public async submit() {
    assert(this.isValid, 'can not submit');
    const newNote = await this.remote.note.create.mutate({ type: NoteTypes.Material, ...this.get() });
    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.hasSubmit = true;
    this.formOptions.onSubmit();
  }

  public destroy() {
    if (!this.hasSubmit) {
      this.removeTempFile();
    }
  }

  private removeTempFile() {
    if (this.file?.isTemp) {
      this.remote.file.removeOne.mutate(this.file.id);
    }
  }
}
