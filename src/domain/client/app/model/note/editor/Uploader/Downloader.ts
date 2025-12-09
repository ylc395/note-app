import assert from 'assert';
import { action, computed, observable } from 'mobx';
import z from 'zod';
import { last } from 'lodash-es';
import { createMutation, createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { MimeTypes, type FileDTO } from '#domain/shared/model/file';
import { debounceAction } from '#utils/function';

const urlSchema = z.url();

export type DownloadedFile = Required<Omit<FileDTO, 'lang'>>;

export default class Downloader {
  constructor(private readonly options: { onDownloaded: (file: DownloadedFile) => void }) {}

  private readonly destroyController = new AbortController();

  private readonly remote = container.resolve(rpcToken);

  @observable private accessor url: string | undefined;

  @observable public accessor loadedSize = 0;

  @computed public get isChecking() {
    return this.setUrl.isPending || this.duplicatedNotes.isFetching;
  }

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

  public readonly setUrl = debounceAction((url: string) => {
    this.url = url;
  }, 500);

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

  public readonly metadata = createQuery(
    ({ queryKey: [_, { url }], signal }) => {
      return this.remote.file.queryRemoteMetadata.query(url!, { signal });
    },
    {
      abortSignal: this.destroyController.signal,
      enabled: false,
      options: () => ({
        queryKey: ['remote.metadata', { url: this.url }] as const,
      }),
    },
  );

  public readonly download = createMutation(
    async () => {
      await this.metadata.refetch();

      return new Promise<DownloadedFile>((resolve, reject) => {
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
            assert(this.metadata.result.data?.mimeType && this.url);

            if (this.metadata.result.data.mimeType === MimeTypes.HTML) {
              loadedData = (await this.remote.file.inlineHTML.query({
                html: loadedData,
                url: this.url,
              })) as ArrayBuffer;
            }

            resolve({
              data: loadedData,
              name: this.getFileNameFromUrl(),
              mimeType: this.metadata.result.data.mimeType,
              sourceUrl: this.url,
            });
          },
          onError: reject,
          signal: this.destroyController.signal,
        });
      });
    },
    { onSuccess: (e) => this.options.onDownloaded(e) },
  );

  public cancel() {
    this.destroyController.abort();
  }
}
