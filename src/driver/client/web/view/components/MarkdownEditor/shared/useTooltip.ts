import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  type VirtualElement,
  type Placement,
  type Middleware,
} from '@floating-ui/dom';
import { editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { posToDOMRect } from '@milkdown/kit/prose';
import { createEffect, createSignal, onCleanup } from 'solid-js';

export function useTooltip(options: {
  ctx: Ctx;
  disabled?: boolean;
  reference: VirtualElement | HTMLElement | (() => VirtualElement | HTMLElement) | 'cursor';
  placement?: Placement;
  middleware?: (Middleware | undefined)[];
  boundary?: HTMLElement;
  hideStrategy?: 'escaped' | 'referenceHidden';
}) {
  const [tooltipEl, setTooltipEl] = createSignal<HTMLElement>();
  const editorView = options.ctx.get(editorViewCtx);

  createEffect(() => {
    if (options.disabled) {
      return;
    }

    const rootEl = tooltipEl();

    if (!rootEl) {
      return;
    }

    const reference = typeof options.reference === 'function' ? options.reference() : options.reference;
    const boundary = options.boundary ?? (options.ctx.get(rootCtx) as HTMLElement);

    const middleware = [
      hide({ boundary, strategy: options.hideStrategy ?? 'escaped' }),
      flip({ boundary }),
      ...(options.middleware ?? []),
    ];

    let realReference: VirtualElement | HTMLElement | undefined;

    if (reference === 'cursor') {
      realReference = {
        contextElement: editorView.dom,
        getBoundingClientRect: () =>
          posToDOMRect(editorView, editorView.state.selection.anchor, editorView.state.selection.anchor),
      };
    } else {
      realReference = reference;
    }

    const stopAutoUpdate = autoUpdate(realReference, rootEl, async () => {
      const { x, y, middlewareData } = await computePosition(realReference, rootEl!, {
        placement: options.placement ?? 'top',
        middleware,
      });

      Object.assign(rootEl!.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute',
        zIndex: '10',
        display: middlewareData.hide?.escaped ? 'none' : '',
      });
    });

    onCleanup(stopAutoUpdate);
  });

  return { setTooltipEl };
}
