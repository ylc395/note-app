import shell from '#web/infra/shell';
import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  type VirtualElement,
  type Placement,
  type Middleware,
} from '@floating-ui/dom';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { listenerCtx } from '@milkdown/kit/plugin/listener';
import { posToDOMRect } from '@milkdown/kit/prose';
import { pull } from 'lodash-es';
import { createEffect, createSignal, onCleanup, type JSX } from 'solid-js';
import { createComponent, render } from 'solid-js/web';

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

export function showFloating<T>(
  ctx: Ctx,
  component: (props: T) => JSX.Element,
  props: (params: { destroy: () => void }) => T,
) {
  const container = document.createElement('div');
  container.dataset.editorTooltipContainer = 'true';
  shell.appRoot.append(container);
  const dispose = render(() => createComponent(component, props({ destroy })), container);

  function destroy() {
    const editorView = ctx.get(editorViewCtx);
    dispose();
    container.remove();
    editorView.focus();
  }

  return true;
}
