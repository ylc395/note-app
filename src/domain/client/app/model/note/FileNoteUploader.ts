import { createMutation, createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';
import { action, computed, observable, when } from 'mobx';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { FileDTO } from '#domain/shared/model/file';
import { getHash } from '#utils/file';
import type { NewNoteDTO, NoteVO } from '#domain/shared/model/note';
import DomainEventBus from './EventBus';

export default class FileNoteUploader {
  constructor(
    private readonly options: {
      files: FileDTO[];
      onUpload?: (files: FileDTO[]) => void;
      onFinish?: (error?: unknown) => void;
      params?: Partial<NewNoteDTO>;
      noteId?: NoteVO['id'];
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
    return this.duplicatedFiles.length > 0;
  }

  private async init() {
    if (!this.options.noteId) {
      assert(this.options.files.length === 1, 'only one file is acceptable when noteId is provided');
    }

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

    this.options.onUpload?.(files);

    try {
      await Promise.all(files.map((file) => this.fileUploadingMap.get(file)!.mutate()));
    } catch (error) {
      this.options.onFinish?.(error);
      return;
    }

    this.options.onFinish?.();
  }

  private uploadFile(file: FileDTO) {
    return createMutation(
      () => {
        const result = this.fileNoteMap.get(file)?.data;
        assert(result);

        return this.options.noteId
          ? this.remote.note.setFile.mutate([this.options.noteId, file])
          : this.remote.note.create.mutate({
              ...this.options.params,
              ...(result.notes.length > 0 ? { fileHash: result.hash } : { file }),
              title: file.name,
            });
      },
      {
        onSuccess: (data) => {
          if (this.options.noteId) {
            this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
              id: this.options.noteId,
              source: this,
              payload: data,
            });
          } else {
            this.domainEventBus.emit(DomainEventBus.eventNames.Created, data);
          }
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
