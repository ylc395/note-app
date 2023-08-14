import { $view } from '@milkdown/utils';
import { imageSchema } from '@milkdown/preset-commonmark';
import { container } from 'tsyringe';

import FileLoader from './FileLoader';

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

function createMediaElement(mimeType: string, data: ArrayBuffer) {
  let mediaEl: HTMLImageElement | HTMLAudioElement | HTMLVideoElement;

  if (mimeType.startsWith('audio')) {
    mediaEl = document.createElement('audio');
  } else if (mimeType.startsWith('video')) {
    mediaEl = document.createElement('video');
  } else {
    mediaEl = document.createElement('img');
  }

  if (!(mediaEl instanceof HTMLImageElement)) {
    mediaEl.controls = true;
  }

  // todo: revoke url
  mediaEl.src = window.URL.createObjectURL(new Blob([data]));
  return mediaEl;
}

export const multimediaNodeView = $view(imageSchema.node, () => {
  return (node) => {
    const dom = document.createElement('span');
    const url = node.attrs.src;

    if (typeof url !== 'string') {
      // todo: visible and friendly non-url resource element
      return { dom };
    }

    const fileLoader = container.resolve(FileLoader);
    fileLoader.load(url).then(({ data, mimeType }) => {
      const mediaEl = createMediaElement(mimeType, data);
      dom.append(mediaEl);
    });

    return { dom };
  };
});

export default [multimediaSchema, multimediaNodeView].flat();
