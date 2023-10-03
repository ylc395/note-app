import type { Extension as MdastExtension } from 'mdast-util-from-markdown';
import type { Image } from 'mdast';
import { is } from '../utils';

export interface Multimedia extends Omit<Image, 'type'> {
  type: 'multimedia';
}

declare module 'mdast' {
  interface RootContentMap {
    multimedia: Multimedia;
  }
}

// transform image token to multimedia node
export const mdastExtension: MdastExtension = {
  enter: {
    image: function (token) {
      const parent = this.stack[this.stack.length - 1];

      if (!parent || !('children' in parent)) {
        throw new Error('no parent');
      }

      this.enter({ type: 'multimedia', title: null, url: '', alt: null }, token);
    },
  },
  exit: {
    // copy from https://github.com/syntax-tree/mdast-util-from-markdown/blob/2e27c0655ec94c0369b7bd4b037cbe41e7429045/dev/lib/index.js#L1011
    image: function (token) {
      const node = this.stack[this.stack.length - 1];

      if (!node || !is<Multimedia>(node, 'multimedia')) {
        throw new Error('no multimedia');
      }

      if (this.data.inReference) {
        /** @type {ReferenceType} */
        const referenceType = this.data.referenceType || 'shortcut';

        node.type += 'Reference';
        // @ts-expect-error: mutate.
        node.referenceType = referenceType;
        // @ts-expect-error: mutate.
        delete node.url;
        delete node.title;
      } else {
        // @ts-expect-error: mutate.
        delete node.identifier;
        // @ts-expect-error: mutate.
        delete node.label;
      }

      this.data.referenceType = undefined;
      this.exit(token);
    },
  },
};
