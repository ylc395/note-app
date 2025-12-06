import assert from 'assert';
import { action, computed, observable, runInAction } from 'mobx';
import z from 'zod';
import { debounce, last } from 'lodash-es';
import { createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { MimeTypes, type FileDTO, type RemoteFileMetadata } from '#domain/shared/model/file';

const urlSchema = z.url();

export type DownloadedFile = Required<Omit<FileDTO, 'lang'>>;

export default class Downloader {
  constructor(private readonly options: { onDownloaded: (file: DownloadedFile) => void }) {}

  private readonly destroyController = new AbortController();

  private readonly remote = container.resolve(rpcToken);

  @observable private accessor url: string | undefined;

  @observable.ref public accessor metadata: Readonly<RemoteFileMetadata> | undefined;

  @observable public accessor loadedSize = 0;

  @observable public accessor isDownloading = false;

  @observable private accessor isWaitingToCheck = false;

  @computed public get isChecking() {
    return this.isWaitingToCheck || this.duplicatedNotes.isFetching;
  }

  private readonly troToCheck = debounce(
    action(() => {
      this.isWaitingToCheck = false;
      this.duplicatedNotes.refetch(); // 当前正在进行的请求会被 cancel
      return true;
    }),
    1000,
  );

  public readonly duplicatedNotes = createQuery(
    async ({ queryKey: [_, { sourceUrl }], signal }) =>
      this.remote.note.query.query({ sourceUrl: sourceUrl! }, { signal }),
    {
      abortSignal: this.destroyController.signal,
      enabled: false,
      options: () => ({
        queryKey: ['duplicatedNotes', { sourceUrl: this.url }] as const,
      }),
    },
  );

  @action
  public setUrl(url: string) {
    this.url = url;

    if (this.isValidUrl) {
      this.isWaitingToCheck = true;
      this.troToCheck();
    }
  }

  @computed
  public get isValidUrl() {
    return urlSchema.safeParse(this.url).success;
  }

  @computed
  public get isEmptyUrl() {
    return !this.url;
  }

  private getFileNameFromUrl() {
    assert(this.url);

    const url = new URL(this.url);
    const lastPathname = last(url.pathname.split('/'))?.split('.')[0];

    return lastPathname || url.hostname;
  }

  public async download() {
    assert(this.isValidUrl && !this.isDownloading && this.url);

    runInAction(() => {
      this.isDownloading = true;
    });
    const metadata = await this.remote.file.queryRemoteMetadata.query(this.url);

    runInAction(() => {
      this.metadata = metadata;
    });

    const chunks: Uint8Array[] = [];

    this.remote.file.download.subscribe(this.url!, {
      onData: action((chunk) => {
        this.loadedSize += chunk.length;
        chunks.push(chunk as Uint8Array);
      }),
      onComplete: async () => {
        const result = new Uint8Array(this.loadedSize);
        let offset = 0;

        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        let loadedData = result.buffer;
        assert(this.metadata?.mimeType && this.url);

        if (this.metadata.mimeType === MimeTypes.HTML) {
          loadedData = (await this.remote.file.inlineHTML.query({
            html: loadedData,
            url: this.url,
          })) as ArrayBuffer;
        }

        runInAction(() => {
          this.isDownloading = false;
        });

        this.options.onDownloaded({
          data: loadedData,
          name: this.getFileNameFromUrl(),
          mimeType: this.metadata.mimeType,
          sourceUrl: this.url,
        });
      },
      onError: action(() => {
        this.isDownloading = false;
      }),
      signal: this.destroyController.signal,
    });
  }

  public cancel() {
    this.destroyController.abort();
  }
}
