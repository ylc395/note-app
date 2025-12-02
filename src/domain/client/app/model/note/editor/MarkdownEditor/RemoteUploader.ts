import { action, computed, observable, runInAction } from 'mobx';
import z from 'zod';
import assert from 'assert';
import { last } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { MimeTypes, type RemoteFileMetadata } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';
import { getHash, toText } from '#utils/file';

const urlSchema = z.url();

export default class RemoteUploader {
  constructor(
    private readonly options: {
      noteId: NoteVO['id'];
      onUploaded: (metadata: RemoteFileMetadata) => void;
    },
  ) {}
  private readonly remote = container.resolve(rpcToken);

  private readonly destroyController = new AbortController();

  @observable.ref public accessor metadata: Readonly<RemoteFileMetadata> | undefined;

  @observable.ref public accessor duplicatedNotes: NoteVO[] | undefined;

  @observable public accessor loadedSize = 0;

  @observable public accessor isDownloading = false;

  @observable.ref public accessor loadedData: ArrayBuffer | undefined;

  @action
  public download() {
    assert(this.isValidUrl && !this.isDownloading);
    this.isDownloading = true;
    const chunks: Uint8Array[] = [];

    this.remote.file.download.subscribe(this.url!, {
      onData: action((chunk) => {
        if ('mimeType' in chunk) {
          this.metadata = chunk;
          return;
        }

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

        const loadedData = result.buffer as ArrayBuffer;
        const duplicated = await this.remote.note.query.query(
          { fileHash: await getHash(loadedData) },
          { signal: this.destroyController.signal },
        );

        runInAction(() => {
          if (duplicated.length > 0) {
            this.duplicatedNotes = duplicated;
          }

          this.loadedData = loadedData;
        });
      },
      onStopped: action(() => {
        this.isDownloading = false;
      }),
      signal: this.destroyController.signal,
    });
  }

  @computed
  public get html() {
    if (!this.loadedData || this.metadata?.mimeType !== MimeTypes.HTML) {
      return null;
    }

    return toText(this.loadedData);
  }

  public async upload() {
    assert(this.metadata && this.loadedData && this.url);

    await this.remote.note.setFile.mutate(
      [
        this.options.noteId,
        {
          name: this.getFileName(),
          mimeType: this.metadata.mimeType,
          data: this.loadedData,
          sourceUrl: this.url,
        },
      ],
      {
        signal: this.destroyController.signal,
      },
    );
    this.options.onUploaded(this.metadata);
  }

  private getFileName() {
    assert(this.metadata && this.loadedData && this.url);

    if (this.html) {
      const title = this.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

      if (title) {
        return title;
      }
    }

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
