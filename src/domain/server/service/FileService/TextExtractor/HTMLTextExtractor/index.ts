import { wrap, releaseProxy } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';

import type extract from './extract';
import createWorker from './extract.js?nodeWorker';
import type { TextExtractor } from '../extractor';

export default class HTMLTextExtractor implements TextExtractor {
  public getTextUnitLength() {
    return Promise.resolve(1);
  }

  public async extract({ data }: { data: ArrayBuffer }) {
    const parse = wrap<typeof extract>(nodeEndpoint(createWorker()));
    const result = await parse(data);
    parse[releaseProxy]();

    return Promise.resolve({
      text: result,
      location: {},
      lang: [], // 网页文字记录的语言不重要
    });
  }
}
