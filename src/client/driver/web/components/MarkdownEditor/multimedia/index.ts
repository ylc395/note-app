import { $view } from '@milkdown/utils';
import { imageSchema } from '@milkdown/preset-commonmark';

import FileManager from './FileManager';

export const NODE_NAME = 'image';

export const multimediaSchema = imageSchema.extendSchema((prev) => {
  return (ctx) => {
    const originSchema = prev(ctx);
    return {
      ...originSchema,
      parseDOM: [
        {
          tag: 'img[src], video[src], audio[src]',
          getAttrs: (node) => {
            return {
              src: (node as HTMLElement).getAttribute('src'),
              alt: node instanceof HTMLImageElement ? node.alt : '',
              title: node instanceof HTMLElement ? node.title : '',
            };
          },
        },
      ],
      // toDOM is still required even when NodeView is defined.
      // see https://discuss.prosemirror.net/t/custom-nodeview-and-nodespec-todom/650
      toDOM: () => document.createElement('span'),
    };
  };
});

export const multimediaNodeView = $view(imageSchema.node, (ctx) => {
  const fileManager = new FileManager(ctx);

  return (node) => {
    const dom = document.createElement('span');
    const url = node.attrs.src;

    if (typeof url !== 'string') {
      // todo: visible and friendly non-url resource element
      return { dom };
    }

    fileManager.mountView(url, dom);
    return { dom };
  };
});

export default [multimediaSchema, multimediaNodeView].flat();
