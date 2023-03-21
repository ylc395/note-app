import { $view } from '@milkdown/utils';
import { imageSchema } from '@milkdown/preset-commonmark';
import { container } from 'tsyringe';

import FileMetadataLoader from './FileMetadataLoader';

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
      toMarkdown: {
        match: (node) => node.type.name === NODE_NAME,
        runner: (state, node) => {
          state.addNode('image', undefined, undefined, {
            title: node.attrs.title,
            url: node.attrs.src,
            alt: node.attrs.alt,
          });
        },
      },
    };
  };
});

function createMediaElement(mimeType: string, url: string) {
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
  mediaEl.src = url;

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

    const fileMetadataLoader = container.resolve(FileMetadataLoader);
    fileMetadataLoader.load(url).then((metadata) => {
      const mediaEl = createMediaElement(metadata?.mimeType || '', url);
      dom.append(mediaEl);
    });

    return { dom };
  };
});

export default [multimediaSchema, multimediaNodeView].flat();
