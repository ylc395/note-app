import { posToDOMRect } from '@milkdown/kit/prose';
import { Plugin, type PluginView } from '@milkdown/kit/prose/state';
import { Ctx } from '@milkdown/kit/ctx';
import type { EditorView } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { rootCtx } from '@milkdown/kit/core';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { debounce } from 'lodash-es';
import { reaction } from 'mobx';
import { autoUpdate, computePosition, hide as floatingUIHide } from '@floating-ui/dom';

import shell from '#web/infra/shell';
import View from './View';
import TooltipManager from '../shared/TooltipManager';

export const tooltip = $prose(
  (ctx: Ctx) =>
    new Plugin({
      view: (): PluginView => {
        const tooltipManager = ctx.get(TooltipManager.slice);

        let dispose: undefined | (() => void);

        function shouldShow(view: EditorView) {
          return view.state.selection.content().size > 0;
        }

        const show = debounce((view: EditorView) => {
          const { ranges } = view.state.selection;
          const tooltipRoot = document.createElement('div');

          tooltipRoot.className = 'absolute flex';
          shell.appRoot.append(tooltipRoot);

          const disposeSolidApp = render(() => createComponent(View, { ctx }), tooltipRoot);

          const from = Math.min(...ranges.map((range) => range.$from.pos));
          const to = Math.max(...ranges.map((range) => range.$to.pos));
          const virtualElement = {
            getBoundingClientRect: () => posToDOMRect(view, from, to),
            contextElement: view.dom,
          };

          const stopAutoUpdate = autoUpdate(virtualElement, tooltipRoot, async () => {
            const { x, y, middlewareData } = await computePosition(virtualElement, tooltipRoot, {
              placement: 'top',
              middleware: [floatingUIHide({ strategy: 'escaped', boundary: ctx.get(rootCtx) as HTMLElement })],
            });

            tooltipRoot.classList.toggle('hidden', middlewareData.hide?.escaped);

            Object.assign(tooltipRoot.style, {
              left: `${x}px`,
              top: `${y}px`,
            });
          });

          const stopAutoHide = reaction(
            () => tooltipManager.isEmpty,
            (isEmpty) => tooltipRoot.classList.toggle('invisible', !isEmpty),
            { fireImmediately: true },
          );

          dispose = () => {
            disposeSolidApp();
            stopAutoHide();
            stopAutoUpdate();
            tooltipRoot.remove();
            dispose = undefined;
          };
        }, 500);

        const hide = () => {
          dispose?.();
          show.cancel();
        };

        return {
          update: (view, prevState) => {
            const isSame = prevState && prevState.selection.eq(view.state.selection);

            if (view.composing || isSame) {
              return;
            }

            dispose?.();

            if (shouldShow(view)) {
              show(view);
            }
          },
          destroy: hide,
        };
      },
    }),
);
