import { parentPort } from 'node:worker_threads';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { expose } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';

import { toText } from '#utils/file';

export default function extract(data: ArrayBuffer) {
  let textContent: string;

  try {
    const html = toText(data);
    const dom = new JSDOM(html);
    const reader = new Readability(dom.window.document);
    textContent = reader.parse()?.textContent ?? '';
  } catch (error) {
    console.log(error);
    textContent = '';
  }

  return textContent;
}

expose(extract, nodeEndpoint(parentPort!));
