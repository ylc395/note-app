import { $view } from '@milkdown/utils';
import { imageSchema } from '@milkdown/preset-commonmark';

import NodeView from './NodeView';

export const NODE_NAME = 'image';

// we extend imageSchema into multimediaSchema, instead of creating a new type of node called 'multimedia'
// to avoid overriding a lot of original markdown tokenizer which are based on image node.
const multimediaSchema = imageSchema.extendSchema((prev) => (ctx) => ({
  ...prev(ctx),
  parseDOM: [
    {
      tag: 'img[src], video[src], audio[src]',
      getAttrs: (node) => {
        if (!(node instanceof HTMLElement)) {
          throw new Error('not element');
        }

        return {
          src: node.getAttribute('src'),
          alt: node instanceof HTMLImageElement ? node.alt : '',
          title: node.title,
        };
      },
    },
  ],
  // toDOM is still required even when NodeView is defined.
  // see https://discuss.prosemirror.net/t/custom-nodeview-and-nodespec-todom/650
  toDOM: () => ['span'],
}));

const multimediaNodeView = $view(imageSchema.node, () => {
  return (node) => new NodeView(node);
});

export default [multimediaSchema, multimediaNodeView].flat();
