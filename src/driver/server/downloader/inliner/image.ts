import type { CheerioAPI } from 'cheerio';
import { parseSrcset, stringifySrcset } from 'srcset';

import { isLocalUrl, als } from './utils';

export async function parseImage($: CheerioAPI) {
  const images = $(
    // 暂时先只管图片，video[src],audio[src],embed[src],track[src],object[data] 先不管
    'img[src],img[srcset],source[srcset],input[src][type="image"]',
  );
  const { urlToDataUrl } = als.getStore()!;

  await Promise.all(
    images.map(async (_, el) => {
      const $el = $(el);
      const src = $el.attr('src');
      const srcset = $el.attr('srcset');

      if (src && !isLocalUrl(src)) {
        const resolvedUrl = $el.prop('src')!;
        const dataUrl = await urlToDataUrl(resolvedUrl);

        $el.attr('src', dataUrl).attr('data-origin-src', resolvedUrl);
      }

      if (srcset) {
        const newSet = await Promise.all(
          parseSrcset(srcset)
            .filter(({ url }) => !isLocalUrl(url))
            .map(async ({ url, ...rest }) => ({ ...rest, url: await urlToDataUrl(url) })),
        );

        $el.attr({
          srcset: stringifySrcset(newSet),
          'data-origin-srcset': srcset,
        });
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

      const resolvedUrl = $el.prop('href')!;
      const dataUrl = await urlToDataUrl(resolvedUrl, $el.attr('type'));

      $el.attr({
        href: dataUrl,
        'data-origin-href': resolvedUrl,
      });
    }),
  );
}

// todo：处理 svg 元素。svg 元素中可能使用了 <use> 外联资源
