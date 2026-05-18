import { $inputRule, $nodeSchema, $remark } from '@milkdown/kit/utils';
import { nodeRule } from '@milkdown/kit/prose';
import { mdastExtension, tokenExtension, toMarkdownExtension } from '#domain/shared/infra/markdown/syntax/topic';

export const topicNode = $nodeSchema('topic', () => ({
  inline: true,
  atom: true,
  group: 'inline',
  marks: '',
  parseDOM: [{ tag: 'span[data-topic]', getAttrs: (node) => ({ value: node.textContent }) }],
  leafText: (node) => {
    return node.attrs.value;
  },
  attrs: {
    value: {
      validate: 'string',
    },
  },
  toDOM: (node) => {
    const dom = document.createElement('span');
    dom.dataset.topic = 'true';
    dom.textContent = node.attrs.value;

    return dom;
  },
  toMarkdown: {
    match: (mark) => mark.type.name === 'topic',
    runner: (state, node) => {
      state.addNode('topic', undefined, undefined, { value: node.attrs.value });
    },
  },
  parseMarkdown: {
    match: (node) => node.type === 'topic',
    runner: (state, node, type) => {
      state.addNode(type, { value: node.value });
    },
  },
}));

export const topicInputRule = $inputRule((ctx) =>
  nodeRule(/#([^#]+)#$/, topicNode.type(ctx), {
    getAttr: (match) => ({ value: match[1] }),
  }),
);

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
