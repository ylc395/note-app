import { memoize } from 'lodash-es';

import { als, urlToDataUrl } from './utils';
import { processFavicon, parseImage } from './image';
import { processStyles } from './style';
import { load } from 'cheerio';

export async function inline(html: string, url: string) {
  const memoUrlToDataUrl = memoize(urlToDataUrl);
  const $ = load(html, { baseURI: url });

  await als.run({ urlToDataUrl: memoUrlToDataUrl, baseUrl: url }, async () => {
    // script 就不管了，反正在前端都是要被过滤掉的
    return Promise.all([processFavicon($), parseImage($), processStyles($)]);
  });

  return $.html();
}
