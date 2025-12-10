import { PluginKey, Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { findParent } from '@milkdown/kit/prose';
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';

const nodeTypeToPlaceholder: Record<string, (node: Node) => string> = {
  paragraph: () => '按 / 呼出菜单',
  heading: (node: Node) => `正在输入${node.attrs.level}级标题`,
};

export default $prose(() => {
  return new Plugin({
    key: new PluginKey('PLACEHOLDER'),
    props: {
      decorations: (state) => {
        if (!state.selection.empty) {
          return null;
        }

        const $pos = state.selection.$anchor;
        const node = $pos.parent;
        const getText = nodeTypeToPlaceholder[node.type.name];

        if (
          node.content.size > 0 ||
          !getText ||
          (node.type.name === 'paragraph' && findParent((n) => n !== node && n.isBlock)($pos))
        ) {
          return null;
        }

        const decoration = Decoration.node($pos.before(), $pos.before() + node.nodeSize, {
          class:
            'before:pointer-events-none before:text-black before:content-[attr(data-placeholder)] before:opacity-20 before:absolute',
          'data-placeholder': getText(node),
        });

        if (decoration) {
          return DecorationSet.create(state.doc, [decoration]);
        }

        return null;
      },
    },
  });
});
