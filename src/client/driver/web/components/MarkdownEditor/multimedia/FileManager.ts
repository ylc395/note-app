import { container, singleton } from 'tsyringe';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { getFileIdFromUrl } from '@shared/domain/infra/markdown/utils';

@singleton()
export default class FileManager {
  private readonly remote = container.resolve(rpcToken);
  private readonly urlMap: Record<string, { mimeType: string; blobUrl: string }> = {};
  private readonly urlCountMap: Record<string, number> = {};

  remove(url: string) {
    const urlCount = this.urlCountMap[url];

    if (!urlCount) {
      return;
    }

    if (urlCount > 1) {
      this.urlCountMap[url] -= 1;
      return;
    }

    delete this.urlCountMap[url];

    const file = this.urlMap[url];

    if (file) {
      window.URL.revokeObjectURL(file.blobUrl);
      delete this.urlMap[url];
      console.debug(`revokeObjectURL ${file.blobUrl}`);
    }
  }

  async get(url: string) {
    this.urlCountMap[url] = (this.urlCountMap[url] || 0) + 1;
    return this.urlMap[url] || (await this.load(url));
  }

  private load = async (url: string) => {
    return null;
  };
}
