import { container } from 'tsyringe';

import { token as remoteToken } from 'infra/remote';
import { getFileIdFromUrl } from 'infra/markdown/utils';

export default class FileManager {
  private readonly remote = container.resolve(remoteToken);
  private urlMap = new Map<string, { mimeType: string; blobUrl: string }>();

  remove(url: string) {
    const { blobUrl } = this.urlMap.get(url)!;
    window.URL.revokeObjectURL(blobUrl);
  }

  async mountView(url: string, nodeViewRoot: HTMLElement) {
    const file = this.urlMap.get(url) || (await this.load(url));
    const el = this.createMediaElement(file);

    nodeViewRoot.append(el);
  }

  private load = async (url: string) => {
    const fileId = getFileIdFromUrl(url);

    const { body, headers } = await this.remote.get<void, ArrayBuffer>(
      fileId ? `/files/${fileId}/blob` : `/files/remote/${encodeURIComponent(url)}/blob`,
    );

    const mimeType = headers?.['Content-Type'];

    if (!mimeType) {
      throw new Error('no mimeType');
    }

    const result = {
      blobUrl: window.URL.createObjectURL(new Blob([body])),
      mimeType,
    };

    this.urlMap.set(url, result);

    return result;
  };

  private createMediaElement({ mimeType, blobUrl }: { mimeType: string; blobUrl: string }) {
    let mediaEl: HTMLImageElement | HTMLAudioElement | HTMLVideoElement;

    if (mimeType.startsWith('audio')) {
      mediaEl = document.createElement('audio');
    } else if (mimeType.startsWith('video')) {
      mediaEl = document.createElement('video');
    } else {
      mediaEl = document.createElement('img');
    }

    if (!(mediaEl instanceof HTMLImageElement)) {
      mediaEl.controls = true;
    }

    mediaEl.src = blobUrl;

    return mediaEl;
  }
}
