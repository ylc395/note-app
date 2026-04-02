import { PluginKey, Plugin, type PluginView } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet, type EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';

import { SLASH_KEY } from './slashMenu';
import { isInEmptyHeading, isInEmptyParagraph } from './shared/prosemirrorUtils';

const nodeTypeToPlaceholder: Record<string, (node: Node) => string> = {
  paragraph: () => `按 ${SLASH_KEY} 呼出菜单`,
  heading: (node: Node) => `正在输入${node.attrs.level}级标题`,
};

export default $prose(() => {
  const pluginKey = new PluginKey<{ isEditable: boolean }>('PLACEHOLDER');

  return new Plugin({
    key: pluginKey,

    state: {
      init() {
        return { isEditable: false };
      },

      apply(tr, pluginState) {
        return tr.getMeta(pluginKey) ?? pluginState;
      },
    },

    props: {
      decorations(state) {
        const pluginState = pluginKey.getState(state);

        // 如果不可编辑或有选区，不显示 placeholder
        if (!state.selection.empty || !pluginState?.isEditable) {
          return DecorationSet.empty;
        }

        const $pos = state.selection.$anchor;
        const node = $pos.parent;
        const getText = nodeTypeToPlaceholder[node.type.name];

        // 检查是否在支持的节点类型且为空
        if (!getText || (!isInEmptyHeading($pos) && !isInEmptyParagraph($pos))) {
          return DecorationSet.empty;
        }

        const decoration = Decoration.node($pos.before(), $pos.before() + node.nodeSize, {
          class:
            'before:pointer-events-none before:text-black before:content-[attr(data-placeholder)] before:opacity-20 before:absolute',
          'data-placeholder': getText(node),
        });

        return DecorationSet.create(state.doc, [decoration]);
      },
    },

    view(view): PluginView {
      let previousEditable: boolean | undefined;

      function update(view: EditorView) {
        if (previousEditable !== view.editable) {
          previousEditable = view.editable;

          view.dispatch(
            view.state.tr.setMeta(pluginKey, {
              isEditable: view.editable,
            }),
          );
        }
      }

      update(view);

      return {
        update,
      };
    },
  });
});
