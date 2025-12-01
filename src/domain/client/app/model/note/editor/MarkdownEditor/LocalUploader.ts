import { observable, runInAction } from 'mobx';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import type { FileDTO } from '#domain/shared/model/file';
import { getHash } from '#utils/file';

export type File = Required<Pick<FileDTO, 'mimeType' | 'data' | 'name'>>;

export default class LocalUploader {
  constructor(
    private readonly options: {
      noteId: NoteVO['id'];
      file: File;
      onUploaded: () => void;
    },
  ) {
    this.init();
  }

  private readonly remote = container.resolve(rpcToken);

  @observable.ref public accessor duplicatedNotes: NoteVO[] | undefined;

  private async init() {
    const fileHash = await getHash(this.options.file.data);
    const duplicated = await this.remote.note.query.query({ fileHash }, { signal: this.destroyController.signal });

    if (duplicated.length > 0) {
      runInAction(() => {
        this.duplicatedNotes = duplicated;
      });

      return;
    }

    this.upload();
  }

  public async upload() {
    await this.remote.note.setFile.mutate([this.options.noteId, this.options.file], {
      signal: this.destroyController.signal,
    });
    this.options.onUploaded();
  }

  private readonly destroyController = new AbortController();

  public destroy() {
    this.destroyController.abort();
  }
}
