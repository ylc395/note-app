import { createMutation, createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';
import { computed } from 'mobx';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { FileDTO } from '#domain/shared/model/file';
import { getHash } from '#utils/file';
import type { NewNoteDTO } from '#domain/shared/model/note';
import DomainEventBus from './EventBus';

export default class FileNoteUploader {
  constructor(private readonly files: FileDTO[], public readonly params: NewNoteDTO) {
    for (const file of files) {
      this.fileNoteMap.set(file, this.getDuplicatedNotes(file));
      this.fileUploadingMap.set(file, this.uploadFile(file));
    }
  }

  @computed
  public get isReady() {
    return this.fileNoteMap.values().every(({ isSuccess }) => isSuccess);
  }

  private readonly destroyController = new AbortController();

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly fileNoteMap = new Map<FileDTO, ReturnType<FileNoteUploader['getDuplicatedNotes']>>();

  public readonly fileUploadingMap = new Map<FileDTO, ReturnType<FileNoteUploader['uploadFile']>>();

  public upload(files?: FileDTO[]) {
    for (const file of files || this.files) {
      this.fileUploadingMap.get(file)?.mutate();
    }
  }

  private uploadFile(file: FileDTO) {
    return createMutation(
      () => {
        const result = this.fileNoteMap.get(file)?.data;
        assert(result);

        return this.remote.note.create.mutate({
          ...this.params,
          ...(result.notes.length > 0 ? { fileHash: result.hash } : { file }),
        });
      },
      {
        onSuccess: (note) => {
          this.domainEventBus.emit(DomainEventBus.eventNames.Created, note);
        },
      },
    );
  }

  public destroy() {
    this.destroyController.abort();
  }

  private getDuplicatedNotes(file: FileDTO) {
    return createQuery(
      async ({ signal }) => {
        const hash = await getHash(file.data);
        const notes = await this.remote.note.query.query({ fileHash: hash }, { signal });

        return { hash, notes };
      },
      {
        options: () => ({
          queryKey: ['duplicatedNotes', { data: file.data }] as const,
        }),
        abortSignal: this.destroyController.signal,
      },
    );
  }
}
