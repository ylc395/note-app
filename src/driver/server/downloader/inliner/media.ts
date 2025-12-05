import type { CheerioAPI } from 'cheerio';
import { parseSrcset, stringifySrcset } from 'srcset';

import { isLocalUrl, als } from './utils';

export async function processMedia($: CheerioAPI) {
  const images = $(
    'img[src],img[srcset],video[src],audio[src],source[srcset],embed[src],track[src],input[src][type="image"],object[data]',
  );
  const { urlToDataUrl } = als.getStore()!;

  await Promise.all(
    images.map(async (_, el) => {
      const $el = $(el);
      const src = el.tagName.toUpperCase() === 'OBJECT' ? $el.attr('data') : $el.attr('src');
      const srcset = $el.attr('srcset');

      if (src && !isLocalUrl(src)) {
        const resolvedUrl = $el.prop('src')!;
        const dataUrl = await urlToDataUrl(resolvedUrl);

        $el.attr('src', dataUrl);
      }

      if (srcset) {
        const newSet = await Promise.all(
          parseSrcset(srcset)
            .filter(({ url }) => !isLocalUrl(url))
            .map(async ({ url, ...rest }) => ({ ...rest, url: await urlToDataUrl(url) })),
        );

        $el.attr('srcset', stringifySrcset(newSet));
      }
    }),
  );
}

export async function processFavicon($: CheerioAPI) {
  const icons = $('link[ref="icon"][href]');
  const { urlToDataUrl } = als.getStore()!;

  await Promise.all(
    icons.map(async (_, el) => {
      const $el = $(el);
      const href = $el.attr('href');

      if (!href || isLocalUrl(href)) {
        return;
      }

      const dataUrl = await urlToDataUrl($el.prop('href')!, $el.attr('type'));
      $el.attr('href', dataUrl);
    }),
  );
}

// todo：处理 svg 元素。svg 元素中可能使用了 <use> 外联资源
