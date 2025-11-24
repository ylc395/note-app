import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';

// 该插件实现：当用户删掉了特殊元素内的所有文本后，该特殊元素也被一并删除。否则用户的后续输入会被视为发生在该特殊元素内，这不符合用户的直觉
// 例子（不符合直觉的情况）：用户输入 **aaa**，得到一个 <strong>aaa</strong> 元素，随后用户按3次退格键（删光了aaa），接着又进行输入，这个新输入被标记为 strong
export const deleteEmptyNode = $prose(() => {
  return new Plugin({
    key: new PluginKey('DELETE_EMPTY_NODE'),
    appendTransaction: (transactions, oldState, newState) => {
      if (!transactions.some((tr) => tr.docChanged)) {
        return null;
      }

      if (!newState.selection.empty) return null;

      // 前后的内容都是空，这意味着我们在一个空的文本块元素内
      if (!newState.selection.$anchor.nodeBefore && !newState.selection.$anchor.nodeAfter) {
        const { parent } = newState.selection.$anchor;

        // 这个空的块级元素如果只是段落之类的，空着就空着，不管了
        if (!parent.isTextblock || parent.type.name === 'paragraph') {
          return null;
        }

        let pos = newState.selection.$anchor.pos;
        for (let i = transactions.length - 1; i >= 0; i--) {
          pos = transactions[i]!.mapping.invert().map(pos);
        }

        const $oldPos = oldState.doc.resolve(pos);
        const oldNode = $oldPos.parent;

        // 该块级元素是刚创建出来的，此前并不存在
        if (oldNode.type !== parent.type || oldNode.content.size === 0) {
          return null;
        }

        return newState.tr.setNodeMarkup(newState.selection.$anchor.before(), newState.schema.nodes.paragraph);
      }

      // todo: 处理行内元素的情况。当前卡点：当行内元素的内容被删除光之后，理论上应当把在某处储存着的标记信息给清除掉。但我找不到这个信息被存在哪里了
    },
  });
});
