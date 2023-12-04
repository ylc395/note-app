import { $remark, $nodeSchema } from '@milkdown/utils';
import { tokenExtension, mdastExtension, stringifyExtension } from '@domain/infra/markdown/syntax/topic';

const topicRemark = $remark(
  'topic',
  () =>
    function () {
      const data = this.data();

      add('micromarkExtensions', tokenExtension);
      add('fromMarkdownExtensions', mdastExtension);
      add('toMarkdownExtensions', stringifyExtension);

      function add(field: string, value: unknown) {
        if (Array.isArray(data[field])) {
          (data[field] as Array<unknown>).push(value);
        } else {
          data[field] = [value];
        }
      }
    },
);

const topicSchema = $nodeSchema('topic', () => ({
  group: 'inline',
  inline: true,
  atom: false,
  attrs: {
    value: { default: '' },
  },
  toDOM: (node) => ['span', { 'data-topic': 1 }, `#${node.attrs.value}#`],
  leafText: (node) => `#${node.attrs.value}#`,

  parseMarkdown: {
    match: ({ type }) => type === 'topic',
    runner: (state, node, type) => {
      state.addNode(type, { value: node.value });
    },
  },

  toMarkdown: {
    match: ({ type }) => type.name === 'topic',
    runner: (state, node) => {
      state.addNode('topic', undefined, undefined, { value: node.attrs.value });
    },
  },
}));

export default [topicRemark, topicSchema].flat();
