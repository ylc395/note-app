import { $prose, $shortcut } from '@milkdown/kit/utils';
import { Plugin, PluginKey, TextSelection, type Command } from '@milkdown/kit/prose/state';
import { liftEmptyBlock } from '@milkdown/kit/prose/commands';
import type { Ctx } from '@milkdown/kit/ctx';
import { Mapping } from '@milkdown/kit/prose/transform';
import { paragraphSchema } from '@milkdown/kit/preset/commonmark';

/* 
当用户删掉了特殊行内元素内的所有文本后，该特殊元素也被一并删除。否则用户的后续输入会被视为发生在该特殊元素内，这不符合用户的直觉。
例子（不符合直觉的情况）：用户输入 **aaa**，得到一个 <strong>aaa</strong> 元素，随后用户按3次退格键（删光了aaa），接着又进行输入，这个新输入被标记为 strong
*/
const removeMarkIfEmpty = $prose(() => {
  return new Plugin({
    key: new PluginKey('DELETE_EMPTY_NODE'),
    appendTransaction: (transactions, oldState, newState) => {
      if (!newState.selection.empty || !transactions.some((tr) => tr.docChanged)) {
        return null;
      }

      const mapping = new Mapping(transactions.toReversed().flatMap((tr) => tr.mapping.invert().maps));
      const oldPos = oldState.doc.resolve(mapping.map(newState.selection.$anchor.pos));

      // 行内元素，满足：之前有标记，之后没有标记（或者标记的内容全是空格）
      if (
        oldPos.marks().length > 0 &&
        [newState.selection.$anchor.nodeBefore, newState.selection.$anchor.nodeAfter].every(
          (node) => !node?.marks || node.marks.length === 0 || !node.text?.trim(),
        )
      ) {
        return newState.tr.setStoredMarks(null);
      }
    },
  });
});

// 当用户在一块级元素的开始处退格时，尝试用一个段落来代替之
const downgradeBlock: (ctx: Ctx) => Command = (ctx) => (state, dispatch, view) => {
  // 尝试处理空 block （A）嵌套在另一个 block (B)里的情况：用 A 代替 B
  const liftEmptyBlockResult = liftEmptyBlock(state, dispatch, view);

  if (liftEmptyBlockResult) {
    return true;
  }

  // 以下处理空 block 不嵌套在任何 block 中的情况：直接用 paragraph 节点代替之
  const $cursor = state.selection instanceof TextSelection && state.selection.$cursor;

  if (!dispatch || !$cursor || (view ? !view.endOfTextblock('backward', state) : $cursor.parentOffset > 0)) {
    return false;
  }

  const pos = state.doc.resolve($cursor.pos);

  if (pos.parent.type.name !== 'paragraph') {
    dispatch(state.tr.setNodeMarkup(pos.before(), paragraphSchema.type(ctx)));
    return true;
  }

  return false;
};

const deleteShortcut = $shortcut((ctx) => {
  // milkdown 自带了退格键行为（见 https://github.com/Milkdown/milkdown/blob/8d95233206206a08b787233f5874306989bdf583/packages/core/src/internal-plugin/keymap.ts#L33）
  // 我们自定义的行为会在它们之前执行
  return {
    Backspace: downgradeBlock(ctx),
  };
});

export default [removeMarkIfEmpty, deleteShortcut].flat();
