import assert from 'assert';
import { action, computed, observable, runInAction } from 'mobx';
import z from 'zod';
import { last } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { MimeTypes, type FileDTO, type RemoteFileMetadata } from '#domain/shared/model/file';

const urlSchema = z.url();

export default class Downloader {
  constructor(private readonly options: { onDownloaded: (file: Required<Omit<FileDTO, 'lang'>>) => void }) {}

  private readonly destroyController = new AbortController();

  private readonly remote = container.resolve(rpcToken);

  @observable private accessor url: string | undefined;

  @observable.ref public accessor metadata: Readonly<RemoteFileMetadata> | undefined;

  @observable public accessor loadedSize = 0;

  @observable public accessor isDownloading = false;

  @action
  public setUrl(url: string) {
    this.url = url;
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
