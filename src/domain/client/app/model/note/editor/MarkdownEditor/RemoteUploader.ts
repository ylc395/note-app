import { action, computed, observable, runInAction } from 'mobx';
import z from 'zod';
import assert from 'assert';
import { last } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { MimeTypes, type FileDTO, type RemoteFileMetadata } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';

const urlSchema = z.url();

export default class RemoteUploader {
  constructor(
    private readonly options: {
      noteId: NoteVO['id'];
      onDownloaded: (metadata: FileDTO) => void;
    },
  ) {}
  private readonly remote = container.resolve(rpcToken);

  private readonly destroyController = new AbortController();

  @observable.ref public accessor metadata: Readonly<RemoteFileMetadata> | undefined;

  @observable public accessor loadedSize = 0;

  @observable public accessor isDownloading = false;

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

        this.isDownloading = false;

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

  private getFileNameFromUrl() {
    assert(this.url);

    const url = new URL(this.url);
    const lastPathname = last(url.pathname.split('/'))?.split('.')[0];

    return lastPathname || url.hostname;
  }

  @observable
  private accessor url: string | undefined;

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

  public destroy() {
    this.destroyController.abort();
  }
}
