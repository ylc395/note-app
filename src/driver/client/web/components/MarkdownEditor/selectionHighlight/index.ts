import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import './style.css';

const selectionHighlight = new Highlight();
CSS.highlights.set('markdown-editor-selection', selectionHighlight);

function selectionToDOMRange(view: EditorView) {
  const { state } = view;
  const { from, to } = state.selection;

  const startDOM = view.domAtPos(from);
  const endDOM = view.domAtPos(to);

  try {
    const range = document.createRange();

    range.setStart(startDOM.node, startDOM.offset);
    range.setEnd(endDOM.node, endDOM.offset);

    return range;
  } catch (e) {
    return undefined;
  }
}

export default $prose(() => {
  let selectionRange: Range | undefined;

  function removeRange() {
    if (selectionRange) {
      selectionHighlight.delete(selectionRange);
    }
  }

  return new Plugin({
    props: {
      handleDOMEvents: {
        focusout: (view) => {
          selectionRange = selectionToDOMRange(view);

          if (selectionRange) {
            selectionHighlight.add(selectionRange);
          }
        },
        focusin: removeRange,
      },
    },
    view() {
      return {
        destroy: removeRange,
      };
    },
  });
});
