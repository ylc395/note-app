import { findParent } from '@milkdown/kit/prose';
import type { MarkType, Mark, Node, ResolvedPos } from '@milkdown/kit/prose/model';
import type { EditorState } from '@milkdown/kit/prose/state';

export function findMarkPosition(state: EditorState, markType: MarkType, pos: number) {
  const $pos = state.doc.resolve(pos);
  const { parent } = $pos;
  const currentMarks = $pos.marks();
  const targetMark = currentMarks.find((m) => m.type === markType);

  if (!targetMark) {
    return null;
  }

  let startIndex = $pos.index();
  let endIndex = $pos.indexAfter();

  while (startIndex > 0 && markIsInNode(parent.child(startIndex - 1), targetMark)) {
    startIndex--;
  }

  while (endIndex < parent.childCount && markIsInNode(parent.child(endIndex), targetMark)) {
    endIndex++;
  }

  let startPos = $pos.start();
  let endPos = startPos;

  for (let i = 0; i < startIndex; i++) {
    startPos += parent.child(i).nodeSize;
  }

  endPos = startPos;
  for (let i = startIndex; i < endIndex; i++) {
    endPos += parent.child(i).nodeSize;
  }

  return {
    start: startPos,
    end: endPos,
    mark: targetMark,
  };
}

function markIsInNode(node: Node, targetMark: Mark): boolean {
  return !!node.marks.find((m: Mark) => m.eq(targetMark));
}

export function isInEmptyParagraph($pos: ResolvedPos) {
  const node = $pos.parent;
  return node.content.size === 0 && node.type.name === 'paragraph' && !findParent((n) => n !== node && n.isBlock)($pos);
}

export function isInEmptyHeading($pos: ResolvedPos) {
  const node = $pos.parent;
  return node.content.size === 0 && node.type.name === 'heading';
}
