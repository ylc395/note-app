/* Copyright 2021, Milkdown by Mirone. */
import { $nodeSchema, $view } from '@milkdown/utils';

export const NODE_NAME = 'multimedia';

export const multimediaSchema = $nodeSchema(NODE_NAME, () => {
  return {
    inline: true,
    group: 'inline',
    selectable: true,
    draggable: true,
    atom: true,
    marks: '',
    isolating: true,
    attrs: {
      src: { default: '' },
      alt: { default: '' },
      title: { default: '' },
      mimeType: { default: '' },
    },
    // toDOM is still required even when NodeView is defined.
    // see https://discuss.prosemirror.net/t/custom-nodeview-and-nodespec-todom/650
    toDOM: () => document.createElement('span'),
    parseMarkdown: {
      match: ({ type }) => type === 'image',
      runner: (state, node, type) => {
        const src = node.url as string;
        const alt = node.alt as string;
        const title = node.title as string;
        state.addNode(type, {
          src,
          alt,
          title,
        });
      },
    },
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
});

function createMediaElement(mimeType: string) {
  let mediaEl: HTMLImageElement | HTMLAudioElement | HTMLVideoElement;

  if (mimeType.startsWith('image')) {
    return document.createElement('img');
  } else if (mimeType.startsWith('audio')) {
    mediaEl = document.createElement('audio');
  } else if (mimeType.startsWith('video')) {
    mediaEl = document.createElement('video');
  } else {
    return;
  }

  mediaEl.controls = true;
  return mediaEl;
}

export const multimediaNodeView = $view(multimediaSchema.node, () => {
  return (node) => {
    const dom = document.createElement('span');
    const url = node.attrs.src;
    const mimeType = node.attrs.mimeType;
    if (typeof url !== 'string') {
      throw new Error('no url in node');
    }

    if (mimeType) {
      const mediaEl = createMediaElement(mimeType);

      if (mediaEl) {
        mediaEl.src = url;
        dom.appendChild(mediaEl);
      }

      return { dom };
    }

    let blobUrl: string | undefined;
    fetch(url).then((response) => {
      const mimeType = response.headers.get('content-type');

      if (mimeType) {
        const mediaEl = createMediaElement(mimeType);

        if (mediaEl) {
          response.blob().then((blob) => {
            mediaEl.src = URL.createObjectURL(blob);
            blobUrl = url;
            dom.appendChild(mediaEl);
          });
        }
      }
    });

    return {
      dom,
      destroy: () => blobUrl && URL.revokeObjectURL(blobUrl),
    };
  };
});

export default [multimediaSchema, multimediaNodeView].flat();
