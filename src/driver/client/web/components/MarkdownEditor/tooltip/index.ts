import { TooltipProvider } from '@milkdown/kit/plugin/tooltip';
import { Plugin, type PluginView } from '@milkdown/kit/prose/state';
import { Ctx } from '@milkdown/kit/ctx';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { debounce } from 'lodash-es';
import type { EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { reaction } from 'mobx';

import shell from '#web/infra/shell';
import View from './View';
import TooltipManager from '../shared/TooltipManager';

export const tooltip = $prose(
  (ctx: Ctx) =>
    new Plugin({
      view: (): PluginView => {
        const tooltipManager = ctx.get(TooltipManager.slice);
        const tooltipRoot = document.createElement('div');
        tooltipRoot.className = 'absolute flex';

        let dispose: undefined | (() => void);

        function show() {
          if (dispose) {
            return;
          }

          dispose = render(() => createComponent(View, { ctx }), tooltipRoot);
        }

        function hide() {
          dispose?.();
          dispose = undefined;
        }

        function shouldShow(view: EditorView) {
          return view.state.selection.content().size > 0;
        }

        const provider = new TooltipProvider({
          content: tooltipRoot,
          debounce: 0, // 名为 debounce，内部的实现却是 throttle。这里填个 0 禁用掉 throttle，我们自己 debounce
          offset: 16,
          root: shell.appRoot as HTMLElement,
          shouldShow,
        });

        const debouncedUpdate = debounce(provider.update, 500);
        provider.onShow = show;
        provider.onHide = hide;

        const stopAutoHide = reaction(
          () => tooltipManager.isEmpty,
          (isEmpty) => tooltipRoot.classList.toggle('hidden', !isEmpty),
        );

        return {
          update: (view, prevState) => {
            if (shouldShow(view)) {
              debouncedUpdate(view, prevState);
            } else {
              debouncedUpdate.cancel();
              provider.update(view, prevState);
            }
          },
          destroy: () => {
            dispose?.();
            provider.destroy();
            tooltipRoot.remove();
            debouncedUpdate.cancel();
            stopAutoHide();
          },
        };
      },
    }),
);
