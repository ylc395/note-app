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
    },
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

    if (typeof url !== 'string') {
      // todo: visible and friendly non-url resource element
      return { dom };
    }

    let blobUrl: string | undefined;
    fetch(url).then((response) => {
      const mimeType = response.headers.get('content-type');

      const mediaEl = createMediaElement(mimeType || 'image/*');

      if (mediaEl) {
        response.blob().then((blob) => {
          blobUrl = URL.createObjectURL(blob);
          mediaEl.src = blobUrl;
          dom.appendChild(mediaEl);
        });
      } else {
        dom.append(`unsupported resource type: ${mimeType}`);
      }
    });

    return {
      dom,
      destroy: () => blobUrl && URL.revokeObjectURL(blobUrl),
    };
  };
});

export default [multimediaSchema, multimediaNodeView].flat();
