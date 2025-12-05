import { memoize } from 'lodash-es';

import { als, urlToDataUrl } from './utils';
import { processFavicon, processMedia } from './media';
import { processStyles } from './style';
import { load } from 'cheerio';

export async function inline(html: string, url: string) {
  const memoUrlToDataUrl = memoize(urlToDataUrl);
  const $ = load(html, { baseURI: url });

  await als.run({ urlToDataUrl: memoUrlToDataUrl, baseUrl: url }, async () => {
    return Promise.all([processFavicon($), processMedia($), processStyles($)]);
  });

  return $.html();
}
