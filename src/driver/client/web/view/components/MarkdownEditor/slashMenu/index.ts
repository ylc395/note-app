import { Plugin, type EditorState } from '@milkdown/kit/prose/state';
import { findParent } from '@milkdown/kit/prose';
import { $prose } from '@milkdown/kit/utils';
import { render, createComponent } from 'solid-js/web';
import { editorViewCtx } from '@milkdown/kit/core';
import { inlineCodeSchema, codeBlockSchema, blockquoteSchema } from '@milkdown/kit/preset/commonmark';

import shell from '#web/infra/shell';
import View from './View';
import { SLASH_KEY } from './constants';

export default $prose((ctx) => {
  let dispose: (() => void) | undefined;
  let menuRoot: HTMLElement | undefined;

  function show() {
    hide();

    menuRoot = document.createElement('div');
    dispose = render(
      () =>
        createComponent(View, {
          ctx,
          onClose: (slash?: boolean) => {
            hide(true);

            if (slash) {
              const editorView = ctx.get(editorViewCtx);
              editorView.dispatch(editorView.state.tr.insertText(SLASH_KEY));
            }
          },
        }),
      menuRoot,
    );
    shell.appRoot.append(menuRoot);
  }

  function hide(focus = false) {
    dispose?.();
    menuRoot?.remove();
    dispose = undefined;
    menuRoot = undefined;

    if (focus) {
      const editorView = ctx.get(editorViewCtx);
      editorView.focus();
    }
  }

  function shouldShow(state: EditorState) {
    if (!state.selection.empty) {
      return false;
    }

    const $pos = state.selection.$anchor;

    if ($pos.parent.type.name === codeBlockSchema.type(ctx).name) {
      return false;
    }

    // 光标不能位于行内代码中
    if ($pos.marks().some((mark) => mark.type.name === inlineCodeSchema.type(ctx).name)) {
      return false;
    }

    // 光标不能位于引用块中
    if (findParent((node) => node.type.name === blockquoteSchema.type(ctx).name)($pos)) {
      return false;
    }

    return true;
  }

  return new Plugin({
    props: {
      handleKeyPress: (view, e) => {
        if (e.key === SLASH_KEY && !menuRoot && shouldShow(view.state)) {
          show();
          return true;
        }
      },
    },
    view: () => ({
      destroy: hide,
    }),
  });
});
