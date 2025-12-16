import { TooltipProvider } from '@milkdown/kit/plugin/tooltip';
import type { PluginSpec, PluginView } from '@milkdown/kit/prose/state';
import { tooltipFactory } from '@milkdown/kit/plugin/tooltip';
import { Ctx } from '@milkdown/kit/ctx';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';

import shell from '#web/infra/shell';
import View from './View';
import { debounce } from 'lodash-es';
import type { EditorView } from '@milkdown/kit/prose/view';

export const tooltip = tooltipFactory('my-tooltip');

export const plugin: (ctx: Ctx) => PluginSpec<unknown> = (ctx) => ({
  view: function tooltipPluginView(): PluginView {
    const content = document.createElement('div');
    content.className = 'absolute flex';

    let dispose: undefined | (() => void);
    const show = () => {
      if (dispose) {
        return;
      }

      dispose = render(() => createComponent(View, { ctx }), content);
    };

    const hide = () => {
      dispose?.();
      dispose = undefined;
    };

    const shouldShow = (view: EditorView) => view.state.selection.content().size > 0;

    const provider = new TooltipProvider({
      content,
      debounce: 0, // 名为 debounce，内部的实现却是 throttle。这里填个 0 禁用掉 throttle，我们自己 debounce
      offset: 16,
      root: shell.appRoot as HTMLElement,
      shouldShow,
    });

    const debouncedUpdate = debounce(provider.update, 500);
    provider.onShow = show;
    provider.onHide = hide;

    return {
      update: (view, prevState) => {
        if (!shouldShow(view)) {
          debouncedUpdate.cancel();
          provider.update(view, prevState);
        } else {
          debouncedUpdate(view, prevState);
        }
      },
      destroy: () => {
        dispose?.();
        provider.destroy();
        content.remove();
      },
    };
  },
});
