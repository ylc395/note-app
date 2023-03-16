import type { HttpFileMetadata, HttpFileMetadataRequest } from 'interface/File';
import { singleton, container } from 'tsyringe';
import memoize from 'lodash/memoize';

import { token as remoteToken } from 'infra/Remote';

@singleton()
export default class FileMetadataLoader {
  private readonly remote = container.resolve(remoteToken);

  private readonly _load = memoize(async (url: string) => {
    const storageKey = `file-metadata-${url}`;
    const metadataJson = localStorage.getItem(storageKey);

    if (metadataJson) {
      return JSON.parse(metadataJson) as HttpFileMetadata;
    }

    const { body, status } = await this.remote.get<HttpFileMetadataRequest, HttpFileMetadata>('/files/metadata', {
      url,
    });

    if (status === 200) {
      localStorage.setItem(storageKey, JSON.stringify(body));
      return body;
    }
  });

  async load(url: string) {
    const result = await this._load(url);
    this._load.cache.delete(url);

    return result;
  }
}
