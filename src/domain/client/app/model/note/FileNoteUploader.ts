import { createMutation, createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';
import { computed, when } from 'mobx';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { FileDTO } from '#domain/shared/model/file';
import { getHash } from '#utils/file';
import type { NewNoteDTO } from '#domain/shared/model/note';
import DomainEventBus from './EventBus';

export default class FileNoteUploader {
  constructor(
    private readonly options: {
      files: FileDTO[];
      onUpload: (files: FileDTO[]) => void;
      onFinish: () => void;
      params: Partial<NewNoteDTO>;
    },
  ) {
    for (const file of options.files) {
      this.fileNoteMap.set(file, this.getDuplicatedNotes(file));
      this.fileUploadingMap.set(file, this.uploadFile(file));
    }
  }

  private readonly destroyController = new AbortController();

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly fileNoteMap = new Map<FileDTO, ReturnType<FileNoteUploader['getDuplicatedNotes']>>();

  public readonly fileUploadingMap = new Map<FileDTO, ReturnType<FileNoteUploader['uploadFile']>>();

  @computed
  private get isReady() {
    return this.fileNoteMap.values().every(({ isSuccess }) => isSuccess);
  }

  @computed
  public get hasDuplicated() {
    return this.fileNoteMap.values().some(({ data }) => data?.notes.length);
  }

  public async canUpload() {
    await when(() => this.isReady, { signal: this.destroyController.signal });
    return !this.hasDuplicated;
  }

  public async upload(files?: FileDTO[]) {
    assert(this.isReady);
    files = files || this.options.files;

    this.options.onUpload(files);
    await Promise.all(files.map((file) => this.fileUploadingMap.get(file)!.mutate()));
    this.options.onFinish();
  }

  private uploadFile(file: FileDTO) {
    return createMutation(
      () => {
        const result = this.fileNoteMap.get(file)?.data;
        assert(result);

        return this.remote.note.create.mutate({
          ...this.options.params,
          ...(result.notes.length > 0 ? { fileHash: result.hash } : { file }),
          title: file.name,
        });
      },
      {
        onSuccess: (data) => {
          this.domainEventBus.emit(DomainEventBus.eventNames.Created, data);
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
