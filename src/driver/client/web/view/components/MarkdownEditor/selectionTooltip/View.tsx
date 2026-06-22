import { Ctx } from '@milkdown/kit/ctx';
import { BoldIcon, ItalicIcon, StrikethroughIcon, CodeIcon, LinkIcon, Link2OffIcon } from 'lucide-solid';
import {
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  toggleStrongCommand,
  linkSchema,
  inlineCodeSchema,
  strongSchema,
  emphasisSchema,
} from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand, strikethroughSchema } from '@milkdown/kit/preset/gfm';
import { editorCtx, editorViewCtx } from '@milkdown/kit/core';
import { callCommand, type $Command, type $MarkSchema } from '@milkdown/kit/utils';
import { Portal } from 'solid-js/web';
import { createMemo, createSignal, Show } from 'solid-js';
import { posToDOMRect } from '@milkdown/kit/prose';
import { inline, offset } from '@floating-ui/dom';

import shell from '#web/infra/shell';
import LinkView, { Mode } from '../nodes/link/tooltip/LinkTooltip';
import Button from '../../Button';
import { useTooltip } from '../shared/useTooltip';

export default function View(props: { ctx: Ctx; onClose: () => void }) {
  const editor = createMemo(() => props.ctx.get(editorCtx));
  const editorView = createMemo(() => props.ctx.get(editorViewCtx));

  const [menu, setMenu] = createSignal<'main' | 'link'>('main');

  const virtualElement = createMemo(() => {
    const view = props.ctx.get(editorViewCtx);
    const { ranges } = view.state.selection;
    const from = Math.min(...ranges.map((range) => range.$from.pos));
    const to = Math.max(...ranges.map((range) => range.$to.pos));

    return {
      getBoundingClientRect: () => posToDOMRect(view, from, to),
      getClientRects: () => {
        const start = view.domAtPos(from);
        const end = view.domAtPos(to);

        try {
          const range = document.createRange();
          range.setStart(start.node, start.offset);
          range.setEnd(end.node, end.offset);
          return Array.from(range.getClientRects());
        } catch {
          return [];
        }
      },
      contextElement: view.dom,
    };
  });

  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: virtualElement,
    placement: 'top',
    middleware: [inline(), offset(16)],
    onEscape: props.onClose,
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

  function rangeHasMark(schema: $MarkSchema<string>) {
    const { from, to } = editorView().state.selection;
    return editorView().state.doc.rangeHasMark(from, to, schema.type(props.ctx));
  }

  return (
    <Portal mount={shell.appRoot}>
      <Show when={menu() === 'main'}>
        <div
          ref={setTooltipEl}
          class="absolute rounded-lg border border-border-primary bg-surface-raised px-1 py-1 shadow-md"
        >
          <div class="flex items-center gap-0.5">
            <Button square selected={rangeHasMark(emphasisSchema)} onClick={action(toggleEmphasisCommand)}>
              <ItalicIcon />
            </Button>
            <Button square selected={rangeHasMark(strongSchema)} onClick={action(toggleStrongCommand)}>
              <BoldIcon />
            </Button>
            <Button square selected={rangeHasMark(strikethroughSchema)} onClick={action(toggleStrikethroughCommand)}>
              <StrikethroughIcon />
            </Button>
            <Button square selected={rangeHasMark(inlineCodeSchema)} onClick={action(toggleInlineCodeCommand)}>
              <CodeIcon />
            </Button>
            <Show
              when={rangeHasMark(linkSchema)}
              fallback={
                <Button square onClick={() => setMenu('link')}>
                  <LinkIcon />
                </Button>
              }
            >
              <Button square selected onClick={action(toggleLinkCommand)}>
                <Link2OffIcon />
              </Button>
            </Show>
          </div>
        </div>
      </Show>
      <Show when={menu() === 'link'}>
        <LinkView initialMode={Mode.Edit} onClose={returnToMain} ctx={props.ctx} />
      </Show>
    </Portal>
  );
}
