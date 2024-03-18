import { parseDocument } from 'htmlparser2';
import { textContent, findOne } from 'domutils';
import { TextDecoder } from 'node:util';

import type { Result } from '@domain/service/FileService/TextExtractor.js';

export default class HTMLTextExtractor {
  public static extract({
    data,
    onExtracted,
  }: {
    data: ArrayBuffer;
    onExtracted: (result: Omit<Result, 'fileId'>) => void;
  }) {
    const textDecoder = new TextDecoder();
    const html = textDecoder.decode(data);
    const bodyEl = findOne((el) => el.tagName.toLowerCase() === 'body', [parseDocument(html)]);

    if (!bodyEl) {
      return '';
    }

    onExtracted({
      text: textContent(bodyEl),
      location: {},
      isFinished: true,
    });
  }
}
