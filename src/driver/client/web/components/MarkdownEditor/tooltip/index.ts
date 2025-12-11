import { TooltipProvider } from '@milkdown/kit/plugin/tooltip';
import type { PluginSpec, PluginView } from '@milkdown/kit/prose/state';
import { tooltipFactory } from '@milkdown/kit/plugin/tooltip';
import { Ctx } from '@milkdown/kit/ctx';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';

import shell from '#web/infra/shell';
import View from './View';

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

    const provider = new TooltipProvider({
      content,
      debounce: 500,
      offset: 16,
      root: shell.appRoot as HTMLElement,
      shouldShow: (view) => view.state.selection.content().size > 0,
    });

    provider.onShow = show;
    provider.onHide = hide;

    return {
      update: provider.update,
      destroy: () => {
        dispose?.();
        provider.destroy();
        content.remove();
      },
    };
  },
});
