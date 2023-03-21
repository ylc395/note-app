import debounce from 'lodash/debounce';
import { linkSchema, textSchema } from '@milkdown/preset-commonmark';
import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey, Transaction } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { editorViewCtx } from '@milkdown/core';

import IconLoader from './helper/IconLoader';

interface IconLinkMetadata {
  from: number;
  to: number;
  iconUrl: string | undefined;
}

export default $prose((ctx) => {
  const pluginKey = new PluginKey();
  const iconLoader = new IconLoader();
  const iconLinkMarkType = linkSchema.type();
  const textNodeType = textSchema.type();
  let latestTransaction: Transaction | undefined;

  const updateDecorations = debounce((tr: Transaction) => {
    const view = ctx.get(editorViewCtx);
    const icons: IconLinkMetadata[] = [];
    let iconsCount = 0;

    view.state.doc.descendants((node, pos) => {
      if (node.type !== textNodeType || !node.text) {
        return;
      }

      for (const mark of node.marks) {
        if (mark.type !== iconLinkMarkType) {
          return;
        }

        iconsCount += 1;
        iconLoader.load(mark.attrs.href).then((iconUrl) => {
          icons.push({ from: pos, to: pos + node.textContent.length, iconUrl });

          if (icons.length === iconsCount) {
            if (latestTransaction && tr !== latestTransaction) {
              return;
            }
            console.log(icons);

            view.dispatch(view.state.tr.setMeta(pluginKey, icons));
          }
        });
      }
    });
  }, 2000);

  return new Plugin({
    key: pluginKey,
    props: {
      decorations(this: Plugin, state) {
        return this.getState(state);
      },
    },
    view: () => ({
      destroy: updateDecorations.cancel,
    }),
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, decorationSet) {
        const newDecorationSet = decorationSet.map(tr.mapping, tr.doc);
        const icons = tr.getMeta(pluginKey) as IconLinkMetadata[] | undefined;

        if (icons) {
          return newDecorationSet.add(
            tr.doc,
            icons
              .filter(({ iconUrl }) => iconUrl)
              .map(({ from, to, iconUrl }) =>
                Decoration.inline(from, to, { class: 'with-icon', style: `background-image: url(${iconUrl})` }),
              ),
          );
        }

        if (tr.docChanged) {
          latestTransaction = tr;
          updateDecorations(tr);
        }

        return newDecorationSet;
      },
    },
  });
});
