import { autoUpdate, computePosition, flip, hide, type VirtualElement } from '@floating-ui/dom';
import { editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { posToDOMRect } from '@milkdown/kit/prose';
import { createEffect, onCleanup } from 'solid-js';

export default function View(props: { ctx: Ctx }) {
  let menuRoot: HTMLDivElement | undefined;

  createEffect(() => {
    if (!menuRoot) {
      return;
    }

    const editorView = props.ctx.get(editorViewCtx);
    const pos = editorView.state.selection.anchor;
    const virtualElement: VirtualElement = {
      contextElement: editorView.dom,
      getBoundingClientRect: () => posToDOMRect(editorView, pos, pos),
    };

    const stopAutoUpdate = autoUpdate(virtualElement, menuRoot, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(virtualElement, menuRoot, {
        middleware: [hide({ boundary, strategy: 'escaped' }), flip({ boundary })],
        placement: 'bottom-start',
      });

      Object.assign(menuRoot.style, {
        left: `${x}px`,
        top: `${y}px`,
        display: middlewareData.hide?.escaped ? 'none' : '',
      });
    });
    onCleanup(stopAutoUpdate);
  });

  return (
    <div class="absolute" ref={menuRoot}>
      dddd
    </div>
  );
}
