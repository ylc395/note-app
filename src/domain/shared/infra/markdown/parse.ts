import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';

import { mdastExtension as topicExtension, tokenExtension as topicTokenExtension } from './syntax/topic.js';

export const parseMarkdown = (content: string) => {
  return fromMarkdown(content, {
    mdastExtensions: [topicExtension],
    extensions: [topicTokenExtension],
  });
};

export function markdownToPlain(md: string) {
  return toString(parseMarkdown(md));
}
