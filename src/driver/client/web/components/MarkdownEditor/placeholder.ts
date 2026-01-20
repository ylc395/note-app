import { PluginKey, Plugin } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';
import { editorViewCtx } from '@milkdown/kit/core';

import { SLASH_KEY } from './slashMenu';
import { isInEmptyHeading, isInEmptyParagraph } from './shared/prosemirrorUtils';

const nodeTypeToPlaceholder: Record<string, (node: Node) => string> = {
  paragraph: () => `按 ${SLASH_KEY} 呼出菜单`,
  heading: (node: Node) => `正在输入${node.attrs.level}级标题`,
};

export default $prose((ctx) => {
  return new Plugin({
    key: new PluginKey('PLACEHOLDER'),
    props: {
      decorations: (state) => {
        if (!state.selection.empty || !ctx.get(editorViewCtx).editable) {
          return null;
        }

        const $pos = state.selection.$anchor;
        const node = $pos.parent;
        const getText = nodeTypeToPlaceholder[node.type.name];

        if (!getText || (!isInEmptyHeading($pos) && !isInEmptyParagraph($pos))) {
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
