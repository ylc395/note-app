import { container } from 'tsyringe';
import type { Ctx } from '@milkdown/ctx';
import { EditorStatus, editorCtx } from '@milkdown/core';

import { token as remoteToken } from 'infra/remote';
import { FILE_URL_PREFIX } from 'model/file';

export default class FileManager {
  private readonly remote = container.resolve(remoteToken);
  private urlMap = new Map<string, { mimeType: string; blobUrl: string }>();

  constructor(ctx: Ctx) {
    ctx.get(editorCtx).onStatusChange((status) => status === EditorStatus.OnDestroy && this.reset());
  }

  private reset() {
    for (const { blobUrl } of this.urlMap.values()) {
      window.URL.revokeObjectURL(blobUrl);
    }
  }

  async mountView(url: string, nodeViewRoot: HTMLElement) {
    const file = this.urlMap.get(url) || (await this.load(url));
    const el = this.createMediaElement(file);

    nodeViewRoot.append(el);
  }

  private load = async (url: string) => {
    const fileId = FileManager.getFileIdFromUrl(url);

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

  private static getFileIdFromUrl(url: string) {
    const match = url.match(new RegExp(`${FILE_URL_PREFIX}(.+)`));
    return match?.[1] || null;
  }
}
