import { Plugin, type EditorState } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { render, createComponent } from 'solid-js/web';

import shell from '#web/infra/shell';
import View from './View';
import { isInEmptyParagraph } from '../shared/prosemirrorUtils';

export const SLASH_KEY = '/';

export default $prose((ctx) => {
  let dispose: (() => void) | undefined;
  let menuRoot: HTMLElement | undefined;

  function show() {
    hide();

    menuRoot = document.createElement('div');
    dispose = render(() => createComponent(View, { ctx }), menuRoot);
    shell.appRoot.append(menuRoot);
  }

  function hide() {
    dispose?.();
    menuRoot?.remove();
    dispose = undefined;
    menuRoot = undefined;
  }

  function shouldShow(state: EditorState) {
    return state.selection.empty && isInEmptyParagraph(state.selection.$anchor);
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
