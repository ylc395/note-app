import { container, singleton } from 'tsyringe';
import memoize from 'lodash/memoize';
import { GlobalOutlined } from '@ant-design/icons-svg';
import { renderIconDefinitionToSVGElement } from '@ant-design/icons-svg/es/helpers';

import { token as remoteToken } from 'infra/Remote';
import type { HttpFile, HttpFileRequest } from 'interface/File';

const DEFAULT_LINK_ICON_KEY = 'DEFAULT_LINK_ICON';
const DEFAULT_LINK_ICON = `data:image/svg+xml,${encodeURIComponent(
  renderIconDefinitionToSVGElement(GlobalOutlined, { extraSVGAttrs: { xmlns: 'http://www.w3.org/2000/svg' } }),
)}`;

const cache = new Map();

@singleton()
export default class IconLoader {
  private readonly remote = container.resolve(remoteToken);
  private readonly _load: ReturnType<typeof memoize<(url: string, origin: string) => Promise<string>>>;

  constructor() {
    this._load = memoize(async (origin: string, url: string) => {
      const storageKey = `icon-link-${origin}`;
      const dataUrl =
        localStorage.getItem(storageKey) ||
        (await this.loadFavicon(origin)) ||
        (await this.loadHtml(url)) ||
        DEFAULT_LINK_ICON_KEY;

      localStorage.setItem(storageKey, dataUrl);
      return dataUrl;
    });

    this._load.cache = cache;
  }

  async load(origin: string, url: string) {
    try {
      const result = await this._load(origin, url);
      return result === DEFAULT_LINK_ICON_KEY ? DEFAULT_LINK_ICON : result;
    } catch (e) {
      return DEFAULT_LINK_ICON;
    } finally {
      this._load.cache.delete(origin);
    }
  }

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

  private static async getDataUrl(file: ArrayBuffer, type: string) {
    const dataUrl = await new Promise<string>((resolve) => {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', () => resolve(fileReader.result as string));
      fileReader.readAsDataURL(new Blob([file], { type }));
    });

    return dataUrl;
  }
}
