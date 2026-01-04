import { Plugin, type EditorState } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { render, createComponent } from 'solid-js/web';
import { editorViewCtx } from '@milkdown/kit/core';

import shell from '#web/infra/shell';
import View from './View';

export const SLASH_KEY = '/';

export default $prose((ctx) => {
  let dispose: (() => void) | undefined;
  let menuRoot: HTMLElement | undefined;

  function show() {
    hide();

    menuRoot = document.createElement('div');
    dispose = render(() => createComponent(View, { ctx, onClose: hide.bind(null, true) }), menuRoot);
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
    return state.selection.empty;
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
      update: (view, prevState) => {
        if (menuRoot && (!shouldShow(view.state) || !view.state.selection.eq(prevState.selection))) {
          hide();
        }
      },
      destroy: hide,
    }),
  });
});
