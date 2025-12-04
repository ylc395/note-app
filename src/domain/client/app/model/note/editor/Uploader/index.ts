import assert from 'assert';
import { action, computed, observable, runInAction } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';

import { getHash } from '#utils/file';
import container from '#utils/singletonContainer';
import type { NoteVO } from '#domain/shared/model/note';
import type { FileDTO } from '#domain/shared/model/file';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import Downloader from './Downloader';
import EventBus from '#domain/client/shared/infra/EventBus';
import DomainEventBus from '../../EventBus';

export type FileToUpload = Required<Pick<FileDTO, 'mimeType' | 'data' | 'name'>> & { hash: string; sourceUrl?: string };

export default class Uploader {
  constructor(private readonly options: { noteId: NoteVO['id'] }) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly eventBus = new EventBus<{ downloaded: never; uploaded: never }>('uploader');

  private readonly destroyController = new AbortController();

  @observable.ref public accessor file: FileToUpload | undefined;

  @observable.ref public accessor downloader: Downloader | undefined;

  @action
  public initDownloader() {
    this.downloader = new Downloader({
      onDownloaded: (file) => this.setFile(file, true),
    });
  }

  @action
  public clearDownloader() {
    this.downloader?.cancel();
    this.downloader = undefined;
  }

  public readonly duplicatedNotes = createQuery(
    async ({ queryKey: [_, { hash }] }) =>
      this.remote.note.query.query({ fileHash: hash! }, { signal: this.destroyController.signal }),
    {
      options: () => ({
        enabled: Boolean(this.file?.hash),
        queryKey: ['duplicatedNotes', { hash: this.file?.hash }] as const,
      }),
    },
  );

  @action
  public clearFile() {
    this.file = undefined;
  }

  public async setFile(file: Omit<FileToUpload, 'hash'>, isDownload = false) {
    const hash = await getHash(file.data);

    runInAction(() => {
      this.file = { ...file, hash };
    });

    if (isDownload) {
      this.eventBus.emit('downloaded');
    }

    const duplicated = await this.duplicatedNotes.start();

    if (duplicated.data!.length > 0 || isDownload) {
      return;
    }

    await this.upload();
  }

  public async upload() {
    assert(this.file);
    const { mimeType, title, sourceUrl } = await this.remote.note.setFile.mutate([this.options.noteId, this.file]);

    this.eventBus.emit('uploaded');
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
      id: this.options.noteId,
      source: this,
      payload: { mimeType, title, sourceUrl },
    });
  }

  public destroy() {
    this.destroyController.abort();
    this.downloader?.cancel();
    this.eventBus.clearListeners();
  }
}
