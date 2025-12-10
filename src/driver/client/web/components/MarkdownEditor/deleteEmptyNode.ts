import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state';
import { Mapping, ReplaceAroundStep, ReplaceStep } from '@milkdown/kit/prose/transform';
import { paragraphSchema } from '@milkdown/kit/preset/commonmark';

/* 该插件实现：
1. 当用户删掉了特殊行内元素内的所有文本后，该特殊元素也被一并删除。否则用户的后续输入会被视为发生在该特殊元素内，这不符合用户的直觉。
  例子（不符合直觉的情况）：用户输入 **aaa**，得到一个 <strong>aaa</strong> 元素，随后用户按3次退格键（删光了aaa），接着又进行输入，这个新输入被标记为 strong

2. 当用户删掉了一个块状节点后，用段落节点替换之。否则光标会突然去到上一个块状节点的尾部，不符合直觉
*/
export const deleteEmptyNode = $prose((ctx) => {
  return new Plugin({
    key: new PluginKey('DELETE_EMPTY_NODE'),
    appendTransaction: (transactions, oldState, newState) => {
      if (!newState.selection.empty || !transactions.some((tr) => tr.docChanged)) {
        return null;
      }

      const steps = transactions.filter((tr) => tr.isGeneric).flatMap((tr) => tr.steps);
      const step = steps[0];

      if (!step || steps.length > 1) {
        return null;
      }

      const mapping = new Mapping(transactions.toReversed().flatMap((tr) => tr.mapping.invert().maps));
      const oldPos = oldState.doc.resolve(mapping.map(newState.selection.$anchor.pos));

      // 若此前光标在一个空的非段落的块元素内，并执行了删除操作
      if (
        !oldPos.nodeBefore &&
        !oldPos.nodeAfter &&
        (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) &&
        step.slice.size === 0 &&
        oldPos.parent.isBlock &&
        oldPos.parent.type.name !== 'paragraph'
      ) {
        const newTr = newState.tr.replaceWith(
          newState.selection.$anchor.pos,
          newState.selection.$anchor.pos,
          paragraphSchema.type(ctx).createAndFill()!,
        );

        return newTr.setSelection(TextSelection.create(newTr.doc, oldPos.start()));
      }

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
