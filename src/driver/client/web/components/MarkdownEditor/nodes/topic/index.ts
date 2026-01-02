import { $inputRule, $markSchema, $remark } from '@milkdown/kit/utils';
import { mdastExtension, tokenExtension, toMarkdownExtension } from '#domain/shared/infra/markdown/syntax/topic';
import { markRule } from '@milkdown/kit/prose';

import './style.css';

const topicNode = $markSchema('topic', () => ({
  parseDOM: [{ tag: 'span[data-topic]' }],
  toDOM: () => ['span', { 'data-topic': true }],
  toMarkdown: {
    match: (mark) => mark.type.name === 'topic',
    runner: (state, mark) => {
      state.withMark(mark, 'topic', undefined);
    },
  },
  parseMarkdown: {
    match: (node) => node.type === 'topic',
    runner: (state, node, markType) => {
      state.openMark(markType);
      state.next(node.children);
      state.closeMark(markType);
    },
  },
}));

export const topicInputRule = $inputRule((ctx) => {
  return markRule(/(?:#)([^#]+)(?:#)$/, topicNode.type(ctx));
});

export const topicRemark = $remark(
  'topicRemark',
  () =>
    function () {
      const data = this.data();

      const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
      const fromMarkdownExtensions = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
      const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

      micromarkExtensions.push(tokenExtension);
      fromMarkdownExtensions.push(mdastExtension);
      toMarkdownExtensions.push(toMarkdownExtension);
    },
);

export default [topicNode, topicInputRule, topicRemark].flat();
