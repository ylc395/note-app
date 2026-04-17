import { createMutation, createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';
import { action, computed, observable, when } from 'mobx';

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
    this.init();
  }

  @observable
  private accessor isReady = false;

  private readonly destroyController = new AbortController();

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly fileNoteMap = observable(new Map<FileDTO, ReturnType<FileNoteUploader['getDuplicatedNotes']>>());

  private readonly fileUploadingMap = new Map<FileDTO, ReturnType<FileNoteUploader['uploadFile']>>();

  public get files() {
    return this.options.files;
  }

  @computed
  public get duplicatedFiles() {
    return this.fileNoteMap
      .entries()
      .filter(([_, query]) => query.data?.notes.length)
      .map(([file, query]) => ({ file, notes: query.data!.notes }))
      .toArray();
  }

  @computed
  public get hasDuplicated() {
    return this.fileNoteMap.values().some(({ data }) => data?.notes.length);
  }

  private async init() {
    await Promise.all(
      this.options.files.map(async (file) => {
        const hash = await getHash(file.data);
        this.fileNoteMap.set(file, this.getDuplicatedNotes(hash));
        this.fileUploadingMap.set(file, this.uploadFile(file));
      }),
    );

    when(() => this.fileNoteMap.values().every(({ isSuccess }) => isSuccess)).then(
      action(() => {
        this.isReady = true;
      }),
    );
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

  private getDuplicatedNotes(hash: string) {
    return createQuery(
      async ({ signal }) => {
        const notes = await this.remote.note.query.query({ fileHash: hash }, { signal });
        return { hash, notes };
      },
      {
        options: () => ({
          queryKey: ['duplicatedNotes', { hash }] as const,
        }),
        abortSignal: this.destroyController.signal,
      },
    );
  }
}
