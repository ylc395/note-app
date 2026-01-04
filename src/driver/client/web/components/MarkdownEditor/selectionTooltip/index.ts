import { Plugin, type EditorState, type PluginView } from '@milkdown/kit/prose/state';
import { Ctx } from '@milkdown/kit/ctx';
import type { EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { debounce } from 'lodash-es';

import shell from '#web/infra/shell';
import View from './View';

export default $prose(
  (ctx: Ctx) =>
    new Plugin({
      view: (): PluginView => {
        let dispose: undefined | (() => void);

        const show = async () => {
          const container = document.createDocumentFragment();
          shell.appRoot.append(container);

          const disposeSolidApp = render(() => createComponent(View, { ctx, close: destroy }), container);

          dispose = () => {
            disposeSolidApp();
            dispose = undefined;
          };
        };

        const delayShow = debounce(show, 500);

        const destroy = () => {
          dispose?.();
          delayShow.cancel();
        };

        const update = (view: EditorView, prevState: EditorState) => {
          destroy();

          if (view.composing || view.state.selection.empty) {
            return;
          }

          const content = view.state.selection.content();

          if (content.size === 1 && content.content.firstChild?.isAtom) {
            return;
          }

          const isSame = prevState.selection.eq(view.state.selection);

          if (isSame) {
            show();
          } else {
            delayShow();
          }
        };

        return {
          update,
          destroy,
        };
      },
    }),
);
