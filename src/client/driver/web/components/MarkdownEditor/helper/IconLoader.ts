import { container, singleton } from 'tsyringe';
import memoize from 'lodash/memoize';

import { token as remoteToken } from 'infra/Remote';
import type { HttpFile, HttpFileRequest } from 'interface/File';

@singleton()
export default class IconLoader {
  private readonly remote = container.resolve(remoteToken);

  async load(url: string) {
    if (url.startsWith('#')) {
      return;
    }

    const validUrl = !url.startsWith('https://') && !url.startsWith('http://') ? `https://${url}` : url;

    try {
      const { origin } = new URL(validUrl);

      await this._load(origin, validUrl);
      this._load.cache.delete(origin);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  private readonly _load = memoize(async (origin: string, url: string) => {
    const storageKey = `icon-link-${origin}`;
    const dataUrl =
      localStorage.getItem(storageKey) ||
      (await this.loadFavicon(origin)) ||
      (await this.loadHtml(url)) ||
      'DEFAULT_LINK_ICON';

    localStorage.setItem(storageKey, dataUrl);
    this._load.cache.delete(origin);
  });

  private async loadFavicon(origin: string) {
    const { body } = await this.remote.get<HttpFileRequest, HttpFile<ArrayBuffer>>('/files/external', {
      url: `${origin}/favicon.ico`,
      type: 'arrayBuffer',
    });

    if (body.body && body.headers['content-type']?.includes('image')) {
      return await IconLoader.getDataUrl(body.body, body.headers['content-type']);
    }

    return null;
  }

  private async loadHtml(pageUrl: string) {
    const { body: htmlBody } = await this.remote.get<HttpFileRequest, HttpFile<string>>('/files/external', {
      url: pageUrl,
      type: 'text',
    });

    if (htmlBody.headers['content-type']?.startsWith('text/html') || !htmlBody.body) {
      return null;
    }

    const domParser = new DOMParser();
    const doc = domParser.parseFromString(htmlBody.body, 'text/html');
    let iconUrl = doc.querySelector('link[rel="icon"]')?.getAttribute('href');

    if (!iconUrl) {
      return null;
    }

    iconUrl = new URL(iconUrl, pageUrl).toString();

    const { body: iconBody } = await this.remote.get<HttpFileRequest, HttpFile<ArrayBuffer>>('/files/external', {
      url: iconUrl,
      type: 'arrayBuffer',
    });

    if (!iconBody.headers['content-type']?.includes('image') || !iconBody.body) {
      return null;
    }

    return await IconLoader.getDataUrl(iconBody.body, iconBody.headers['content-type']);
  }

  static async getDataUrl(file: ArrayBuffer, type: string) {
    const dataUrl = await new Promise<string>((resolve) => {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', () => resolve(fileReader.result as string));
      fileReader.readAsDataURL(new Blob([file], { type }));
    });

    return dataUrl;
  }
}
