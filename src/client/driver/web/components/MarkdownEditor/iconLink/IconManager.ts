import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import IconLoader from './IconLoader';

export interface Icon {
  from: number;
  to: number;
  dataUrl: string;
}

export class IconManager {
  private readonly iconLoader = container.resolve(IconLoader);
  private originToDataUrlMap = new Map<string, string>();
  private isDestroyed = false;
  private collectingToken?: symbol;
  constructor(
    private readonly options: {
      traverseLink: (cb: (href: string, pos: number, linkText: string) => void) => void;
      onUpdate: (icons: Icon[]) => void;
    },
  ) {}

  readonly destroy = () => {
    this.isDestroyed = true;
    this.collectIconsDebounce.cancel();
  };

  collectIcons = () => {
    const token = Symbol();

    if (!this.collectingToken) {
      this._collectIcons(token);
    } else {
      this.collectIconsDebounce(token);
    }
    this.collectingToken = token;
  };

  private _collectIcons = async (token: symbol) => {
    const origins = this.getAllOrigins();
    const newOrigins = origins.filter(({ origin }) => !this.originToDataUrlMap.has(origin));

    if (newOrigins.length === 0) {
      return;
    }

    const dataUrls = await Promise.all(newOrigins.map(({ origin, url }) => this.iconLoader.load(origin, url)));

    if (this.isDestroyed || this.collectingToken !== token) {
      return;
    }

    for (const [i, { origin }] of newOrigins.entries()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.originToDataUrlMap.set(origin, dataUrls[i]!);
    }

    this.updateIcons();
  };

  private collectIconsDebounce = debounce(this._collectIcons, 3000);

  private updateIcons() {
    const icons: Icon[] = [];
    this.options.traverseLink((href, pos, linkText) => {
      const origin = IconManager.hrefToOrigin(href);

      if (!origin) {
        return;
      }

      const dataUrl = this.originToDataUrlMap.get(origin.origin);

      if (!dataUrl) {
        throw new Error('no data url for icon');
      }

      icons.push({ from: pos, to: pos + linkText.length, dataUrl });
    });

    this.options.onUpdate(icons);
  }

  private getAllOrigins() {
    const origins: { origin: string; url: string }[] = [];
    this.options.traverseLink((href) => {
      const origin = IconManager.hrefToOrigin(href);

      if (origin) {
        origins.push(origin);
      }
    });

    return origins;
  }

  private static hrefToOrigin(href: string) {
    if (!href || href.startsWith('#')) {
      return null;
    }

    const validUrl = !href.startsWith('https://') && !href.startsWith('http://') ? `https://${href}` : href;

    try {
      return { origin: new URL(validUrl).origin, url: validUrl };
    } catch {
      return null;
    }
  }
}
