import { TextDecoder } from 'node:util';
import { parseDocument } from 'htmlparser2';
import { textContent, findOne } from 'domutils';

import type { TextExtractor } from './extractor';

export default class HTMLTextExtractor implements TextExtractor {
  public getTextUnitLength() {
    return Promise.resolve(1);
  }

  public extract({ data }: { data: ArrayBuffer }) {
    const textDecoder = new TextDecoder();
    const html = textDecoder.decode(data);
    const bodyEl = findOne((el) => el.tagName.toLowerCase() === 'body', [parseDocument(html)], true);

    return Promise.resolve({
      text: bodyEl ? textContent(bodyEl) : '',
      location: {},
      lang: [], // 网页文字记录的语言不重要
    });
  }
}
