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
import { editorCtx, editorViewCtx } from '@milkdown/kit/core';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { Portal } from 'solid-js/web';
import { createMemo, createSignal, Show } from 'solid-js';
import { posToDOMRect } from '@milkdown/kit/prose';
import { useTooltip } from '../shared/useTooltip';

import shell from '#web/infra/shell';
import LinkView, { Mode } from '../nodes/link/tooltip/ExternalLinkView';

export default function View(props: { ctx: Ctx; close: () => void }) {
  const editor = createMemo(() => props.ctx.get(editorCtx));
  const editorView = createMemo(() => props.ctx.get(editorViewCtx));

  const hasLink = createMemo(() => {
    const { from, to } = editorView().state.selection;
    return editorView().state.doc.rangeHasMark(from, to, linkSchema.type(props.ctx));
  });

  const [menu, setMenu] = createSignal<'main' | 'link'>('main');

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

  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: virtualElement(),
    placement: 'top',
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

  return (
    <Portal mount={shell.appRoot}>
      <div ref={setTooltipEl} class="absolute">
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
