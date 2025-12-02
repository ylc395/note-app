import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

import { toText } from '#utils/file';
import type { TextExtractor } from './extractor';

export default class HTMLTextExtractor implements TextExtractor {
  public getTextUnitLength() {
    return Promise.resolve(1);
  }

  public extract({ data }: { data: ArrayBuffer }) {
    const html = toText(data);
    const dom = new JSDOM(html);
    const reader = new Readability(dom.window.document);

    return Promise.resolve({
      text: reader.parse()?.textContent ?? '',
      location: {},
      lang: [], // 网页文字记录的语言不重要
    });
  }
}
