import { Ctx } from '@milkdown/kit/ctx';
import { BoldIcon, ItalicIcon, StrikethroughIcon, CodeIcon, LinkIcon, Link2OffIcon } from 'lucide-solid';
import {
  linkSchema,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  toggleStrongCommand,
} from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { Portal } from 'solid-js/web';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { posToDOMRect } from '@milkdown/kit/prose';
import { autoUpdate, computePosition, flip, hide } from '@floating-ui/dom';

import shell from '#web/infra/shell';
import LinkView, { Mode } from '../link/tooltip/View';

export default function View(props: { ctx: Ctx; close: () => void }) {
  const editor = createMemo(() => props.ctx.get(editorCtx));
  const editorView = createMemo(() => props.ctx.get(editorViewCtx));

  const hasLink = createMemo(() => {
    const { from, to } = editorView().state.selection;
    return editorView().state.doc.rangeHasMark(from, to, linkSchema.type(props.ctx));
  });

  const [menu, setMenu] = createSignal<'main' | 'link'>('main');
  let rootRef: HTMLDivElement | undefined;

  const virtualElement = createMemo(() => {
    const view = props.ctx.get(editorViewCtx);
    const { ranges } = view.state.selection;
    const from = Math.min(...ranges.map((range) => range.$from.pos));
    const to = Math.max(...ranges.map((range) => range.$to.pos));

    return {
      getBoundingClientRect: () => posToDOMRect(view, from, to),
      contextElement: view.dom,
    };
  });

  function action<T>(command: $Command<T>, payload?: T) {
    return () => {
      editor().action(callCommand(command.key, payload));
      editorView().focus();
    };
  }

  function returnToMain() {
    setMenu('main');
    editorView().focus();
  }

  createEffect(() => {
    if (!rootRef) {
      return;
    }

    const stopAutoUpdate = autoUpdate(virtualElement(), rootRef, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(virtualElement(), rootRef, {
        placement: 'top',
        middleware: [hide({ boundary, strategy: 'escaped' }), flip({ boundary })],
      });

      Object.assign(rootRef.style, {
        left: `${x}px`,
        top: `${y}px`,
        display: middlewareData.hide?.escaped ? 'none' : '',
      });
    });

    onCleanup(stopAutoUpdate);
  });

  return (
    <Portal mount={shell.appRoot}>
      <div ref={rootRef} class="absolute">
        <Show when={menu() === 'main'}>
          <button onClick={action(toggleEmphasisCommand)}>
            <ItalicIcon />
          </button>
          <button onClick={action(toggleStrongCommand)}>
            <BoldIcon />
          </button>
          <button onClick={action(toggleStrikethroughCommand)}>
            <StrikethroughIcon />
          </button>
          <button onClick={action(toggleInlineCodeCommand)}>
            <CodeIcon />
          </button>
          <Show
            when={hasLink()}
            fallback={
              <button onClick={() => setMenu('link')}>
                <LinkIcon />
              </button>
            }
          >
            <button onClick={action(toggleLinkCommand)}>
              <Link2OffIcon />
            </button>
          </Show>
        </Show>
        <Show when={menu() === 'link'}>
          <LinkView initialMode={Mode.Edit} onClose={returnToMain} ctx={props.ctx} />
        </Show>
      </div>
    </Portal>
  );
}
