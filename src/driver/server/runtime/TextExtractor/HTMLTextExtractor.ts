import { TextDecoder } from 'node:util';
import { parseDocument } from 'htmlparser2';
import { textContent, findOne } from 'domutils';

export default class HTMLTextExtractor {
  public static extract(data: ArrayBuffer) {
    const textDecoder = new TextDecoder();
    const html = textDecoder.decode(data);
    const bodyEl = findOne((el) => el.tagName.toLowerCase() === 'body', [parseDocument(html)], true);

    if (!bodyEl) {
      return null;
    }

    return textContent(bodyEl);
  }
}
