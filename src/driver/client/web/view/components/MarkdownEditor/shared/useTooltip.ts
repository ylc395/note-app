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
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import { useMilkdownEvent } from './prosemirrorUtils';
import { makeEventListener } from '@solid-primitives/event-listener';
import { customCtx } from '../customCtx';

export function useTooltip(options: {
  ctx: Ctx;
  disabled?: boolean;
  reference: VirtualElement | HTMLElement | (() => VirtualElement | HTMLElement) | 'cursor';
  placement?: Placement;
  middleware?: (Middleware | undefined)[];
  hideStrategy?: 'escaped' | 'referenceHidden';
  onCursorChange?: () => void;
  onEscape?: () => void;
}) {
  const [tooltipEl, setTooltipEl] = createSignal<HTMLElement>();
  const editorView = options.ctx.get(editorViewCtx);

  const reference = createMemo(() => {
    const reference = typeof options.reference === 'function' ? options.reference() : options.reference;

    if (reference === 'cursor') {
      return {
        contextElement: editorView.dom,
        getBoundingClientRect: () =>
          posToDOMRect(editorView, editorView.state.selection.anchor, editorView.state.selection.anchor),
      };
    } else {
      return reference;
    }
  });

  createEffect(() => {
    if (!options.onCursorChange || options.reference !== 'cursor') {
      return;
    }

    useMilkdownEvent({
      event: 'selectionUpdated',
      ctx: options.ctx,
      fn: options.onCursorChange,
    });
  });

  makeEventListener(document, 'keydown', (e) => {
    if (
      e.key === 'Escape' &&
      (editorView.dom.contains(document.activeElement) || tooltipEl()?.contains(document.activeElement))
    ) {
      options.onEscape?.();
    }
  });

  createEffect(() => {
    if (options.disabled) {
      return;
    }

    const rootEl = tooltipEl();

    if (!rootEl) {
      return;
    }

    const stopAutoUpdate = autoUpdate(reference(), rootEl, async () => {
      const boundary = options.ctx.get(customCtx).containerElement ?? (options.ctx.get(rootCtx) as HTMLElement);
      const middleware = [
        hide({ boundary, strategy: options.hideStrategy ?? 'escaped' }),
        flip({ boundary }),
        ...(options.middleware ?? []),
      ];

      const { x, y, middlewareData } = await computePosition(reference(), rootEl!, {
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
