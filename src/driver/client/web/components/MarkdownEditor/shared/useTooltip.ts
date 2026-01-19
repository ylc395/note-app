import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  type VirtualElement,
  type Placement,
  type Middleware,
} from '@floating-ui/dom';
import { editorCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { listenerCtx } from '@milkdown/kit/plugin/listener';
import { pull } from 'lodash-es';
import { createEffect, createSignal, onCleanup } from 'solid-js';

export interface UseTooltipOptions {
  ctx: Ctx;
  reference: VirtualElement | HTMLElement | (() => VirtualElement | HTMLElement);
  placement?: Placement;
  middleware?: (Middleware | undefined)[];
  boundary?: HTMLElement;
  hideStrategy?: 'escaped' | 'referenceHidden';
}

export function useTooltip(options: UseTooltipOptions) {
  const [tooltipEl, setTooltipEl] = createSignal<HTMLElement>();

  createEffect(() => {
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

    const stopAutoUpdate = autoUpdate(reference, rootEl, async () => {
      const { x, y, middlewareData } = await computePosition(reference, rootEl!, {
        placement: options.placement ?? 'top',
        middleware,
      });

      Object.assign(rootEl!.style, {
        left: `${x}px`,
        top: `${y}px`,
        display: middlewareData.hide?.escaped ? 'none' : '',
      });
    });

    onCleanup(stopAutoUpdate);
  });

  return { setTooltipEl };
}

export function useSelectionChanged({ ctx, fn }: { ctx: Ctx; fn: () => void }) {
  const editor = ctx.get(editorCtx);

  editor.action(() => {
    const listener = ctx.get(listenerCtx);
    listener.selectionUpdated(fn);
  });

  onCleanup(() => {
    const listener = ctx.get(listenerCtx);
    pull(listener.listeners.selectionUpdated, fn);
  });
}
