import assert from 'assert';
import { action, observable, runInAction } from 'mobx';
import { createMutation, createQuery } from 'mobx-tanstack-query/preset';

import { getHash } from '#utils/file';
import container from '#utils/singletonContainer';
import type { NoteVO } from '#domain/shared/model/note';
import { FileDTO } from '#domain/shared/model/file';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import Downloader, { type DownloadedFile } from './Downloader';
import EventBus from '#domain/client/shared/infra/EventBus';
import DomainEventBus from '../../EventBus';

export type FileToUpload = Required<Pick<FileDTO, 'mimeType' | 'data' | 'name'>> & { hash: string; sourceUrl?: string };

enum EventNames {
  Downloaded = 'uploader.downloaded',
  Uploaded = 'uploader.uploaded',
}

export default class Uploader {
  constructor(private readonly options: { noteId: NoteVO['id'] }) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly eventBus = new EventBus<{
    [EventNames.Downloaded]: never;
    [EventNames.Uploaded]: never;
  }>('uploader');

  private readonly destroyController = new AbortController();

  @observable.ref public accessor file: FileToUpload | undefined;

  @observable.ref public accessor downloader: Downloader | undefined;

  @action
  public initDownloader() {
    this.downloader = new Downloader({
      onDownloaded: this.handleDownloaded.bind(this),
    });
  }

  @action
  public clearDownloader() {
    this.downloader?.cancel();
    this.downloader = undefined;
  }

  public readonly duplicatedNotes = createQuery(
    async ({ queryKey: [_, { hash }], signal }) => this.remote.note.query.query({ fileHash: hash! }, { signal }),
    {
      options: () => ({
        enabled: Boolean(this.file?.hash),
        queryKey: ['duplicatedNotes', { hash: this.file?.hash }] as const,
      }),
      abortSignal: this.destroyController.signal,
    },
  );

  @action
  public clearFile() {
    this.file = undefined;
  }

  private async handleDownloaded(file: DownloadedFile) {
    await this.setFile(file, false);
    this.eventBus.emit(EventNames.Downloaded);
  }

  public async setFile(file: Omit<FileToUpload, 'hash'>, tryUpload = true) {
    const hash = await getHash(file.data);

    runInAction(() => {
      this.file = { ...file, hash };
    });

    if (!tryUpload) {
      return;
    }

    const duplicated = await this.duplicatedNotes.start();

    if (duplicated.data!.length > 0) {
      return;
    }

    await this.upload.mutate();
  }

  public readonly upload = createMutation(
    () => {
      assert(this.file);
      return this.remote.note.setFile.mutate([this.options.noteId, this.file]);
    },
    {
      onSuccess: ({ mimeType, title, sourceUrl }) => {
        this.eventBus.emit(EventNames.Uploaded);
        this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
          id: this.options.noteId,
          source: this,
          payload: { mimeType, title, sourceUrl },
        });
      },
    },
  );

  public destroy() {
    this.destroyController.abort();
    this.downloader?.cancel();
    this.eventBus.clearListeners();
  }

  public static readonly EventNames = EventNames;
}
