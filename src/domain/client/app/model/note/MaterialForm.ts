import { observable, runInAction } from 'mobx';
import assert from 'assert';

import { NoteTypes, type NewNoteDTO, type NoteVO } from '#domain/shared/model/note';
import Form from '#domain/client/shared/model/abstract/Form';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
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

  public async uploadFile(file: string | ArrayBuffer, mimeType: string) {
    this.set('fileId', undefined);

    const uploadedFile = await this.remote.file.upload.mutate(
      typeof file === 'string' ? { path: file, mimeType } : { data: file, mimeType },
    );

    this.set('fileId', uploadedFile.id);
    const duplicatedNotes = await this.remote.note.query.query({ fileHash: uploadedFile.hash });

    runInAction(() => {
      this.duplicatedNotes = duplicatedNotes;
    });
  }

  public async submit() {
    assert(this.isValid, 'can not submit');
    const newNote = await this.remote.note.create.mutate({ type: NoteTypes.Material, ...this.get() });
    this.domainEventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.formOptions.onSubmit();
  }
}
