import { linkSchema, textSchema } from '@milkdown/preset-commonmark';
import { $prose } from '@milkdown/utils';
import { listenerCtx } from '@milkdown/plugin-listener';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { editorStateCtx, editorViewCtx } from '@milkdown/core';

import { type Icon, IconManager } from './IconManager';
import './style.css';

const pluginKey = new PluginKey();

export default $prose((ctx) => {
  const textNodeType = textSchema.type();
  const linkMarkType = linkSchema.type();
  const iconManager = new IconManager({
    traverseLink(cb) {
      const state = ctx.get(editorStateCtx);

      state.doc.descendants((node, pos) => {
        if (node.type !== textNodeType || !node.text) {
          return;
        }

        for (const mark of node.marks) {
          if (mark.type !== linkMarkType) {
            continue;
          }

          const { textContent } = node;
          cb(mark.attrs.href, pos, textContent);
        }
      });
    },
    onUpdate(icons) {
      const view = ctx.get(editorViewCtx);
      view.dispatch(view.state.tr.setMeta(pluginKey, icons));
    },
  });

  const listeners = ctx.get(listenerCtx);

  listeners.markdownUpdated(iconManager.collectIcons).destroy(iconManager.destroy);

  return new Plugin({
    props: {
      decorations(this: Plugin, state) {
        return this.getState(state);
      },
    },
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, decorationSet) {
        const newIcons = tr.getMeta(pluginKey) as Icon[] | undefined;

        if (!newIcons) {
          return decorationSet.map(tr.mapping, tr.doc);
        }

        return DecorationSet.create(
          tr.doc,
          newIcons.map((icon) =>
            Decoration.inline(icon.from, icon.to, {
              class: 'with-icon',
              style: `background-image: url(${icon.dataUrl})`,
            }),
          ),
        );
      },
    },
  });
});
