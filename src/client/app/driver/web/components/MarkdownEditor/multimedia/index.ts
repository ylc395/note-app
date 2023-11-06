import { $view } from '@milkdown/utils';
import { imageSchema } from '@milkdown/preset-commonmark';

import FileManager from './FileManager';

export const NODE_NAME = imageSchema.id;

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
  const fileManager = new FileManager();

  return (node) => {
    const dom = document.createElement('span');
    const url = node.attrs.src;

    if (typeof url !== 'string') {
      // todo: visible and friendly non-url resource element
      return { dom };
    }

    fileManager.mountView(url, dom);
    return { dom, destroy: () => fileManager.remove(url) };
  };
});

export default [multimediaSchema, multimediaNodeView].flat();
