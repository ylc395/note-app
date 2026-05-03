import { inline, type Placement } from '@floating-ui/dom';
import { editorCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { linkSchema, toggleLinkCommand, updateLinkCommand } from '@milkdown/kit/preset/commonmark';
import { TextSelection } from '@milkdown/kit/prose/state';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import z from 'zod';

import { useTooltip } from '#web/view/components/MarkdownEditor/shared/useTooltip';
import { findMarkPosition, useMilkdownEvent } from '#web/view/components/MarkdownEditor/shared/prosemirrorUtils';
import Button from '#web/view/components/Button';
import EntityPreviewer from './EntityPreviewer';
import LinkInput from './LinkInput';
import { Mode } from './constant';
import useEntitySource from './useEntitySource';
import { ContextProvider } from './context';

export { Mode } from './constant';

function selectLink(ctx: Ctx, linkDom: HTMLElement) {
  const editorView = ctx.get(editorViewCtx);
  const markPos = findMarkPosition(editorView.state, linkSchema.type(ctx), editorView.posAtDOM(linkDom, 0) + 1);

  if (!markPos) {
    return null;
  }

  editorView.dispatch(
    editorView.state.tr.setSelection(TextSelection.create(editorView.state.doc, markPos.start, markPos.end)),
  );

  return markPos;
}

const urlSchema = z.url();

export default function Tooltip(props: {
  ctx: Ctx;
  targetDom?: HTMLAnchorElement;
  mousePosition?: { x: number; y: number }; // 用于行内元素 tooltip 辅助定位的
  initialMode?: Mode;
  initialUrl?: string;
  placement?: Placement;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onModeChange?: (mode: Mode) => void;
  onFixedChange?: (isFixed: boolean) => void;
}) {
  const initialUrl = props.initialUrl || '';
  const editor = props.ctx.get(editorCtx);
  const editorView = props.ctx.get(editorViewCtx);

  const [url, setUrl] = createSignal(initialUrl);
  const [text, setText] = createSignal('');
  const initialMode = props.initialMode ?? Mode.Preview;

  const [mode, setMode] = createSignal(initialMode);
  const isValidHref = createMemo(() => urlSchema.safeParse(url()).success);

  let inputRef: HTMLInputElement | undefined;

  const entity = useEntitySource({
    url: initialUrl,
    ctx: props.ctx,
  });

  const { setTooltipEl } = useTooltip({
    reference: props.targetDom || 'cursor',
    ctx: props.ctx,
    placement: props.placement || 'top',
    ...(props.mousePosition && { middleware: [inline(props.mousePosition)] }),
  });

  function action<T>(command: $Command<T>, payload?: T) {
    if (props.targetDom) {
      selectLink(props.ctx, props.targetDom);
    }

    editor.action(callCommand(command.key, payload));
    editorView.focus();
    props.onClose?.();
  }

  function addTextAndLink() {
    const { from, empty } = editorView.state.selection;

    if (empty) {
      const textValue = text() || url();
      const tr = editorView.state.tr;

      tr.insertText(textValue, from);
      tr.setSelection(TextSelection.create(tr.doc, from, from + textValue.length));
      editorView.dispatch(tr);
    }

    editor.action(callCommand(toggleLinkCommand.key, { href: url() }));
    editorView.focus();
    props.onClose?.();
  }

  function cancel() {
    if (initialMode === Mode.Preview) {
      setUrl(initialUrl);
      setMode(Mode.Preview);
    } else {
      props.onClose?.();
    }
  }

  function remove() {
    action(toggleLinkCommand);
  }

  function update() {
    if (!isValidHref()) {
      return;
    }

    if (mode() === Mode.Add) {
      return addTextAndLink();
    }

    action(initialUrl ? updateLinkCommand : toggleLinkCommand, { href: url() });
  }

  useMilkdownEvent({
    event: 'selectionUpdated',
    ctx: props.ctx,
    fn: () => {
      if (mode() === Mode.Preview) {
        props.onClose?.();
      }
    },
  });

  createEffect(() => {
    props.onModeChange?.(mode());

    if (mode() === Mode.Edit || mode() === Mode.Add) {
      requestAnimationFrame(() => {
        inputRef?.focus();
      });
    }
  });

  return (
    <ContextProvider entity={entity} milkdownCtx={props.ctx}>
      <div
        ref={setTooltipEl}
        class="bg-surface-raised border border-border-primary rounded-lg shadow-lg p-3 min-w-[320px] flex flex-col gap-2"
        onMouseLeave={props.onMouseLeave}
        onMouseEnter={props.onMouseEnter}
      >
        <Show when={entity.entitySource && mode() === Mode.Preview}>
          <EntityPreviewer onFixedChange={props.onFixedChange} />
        </Show>
        <LinkInput mode={mode()} ref={inputRef} value={url()} onInput={setUrl} />
        <Show when={mode() === Mode.Add}>
          <input
            class="bg-transparent text-fg-primary placeholder:text-fg-tertiary outline-none border border-border-primary rounded px-2 py-1 text-sm w-full"
            placeholder="文本"
            value={text()}
            onInput={(e) => setText(e.target.value)}
          />
        </Show>
        <Show
          when={mode() === Mode.Edit || mode() === Mode.Add}
          fallback={
            <div class="flex gap-1 justify-end">
              <Button size="small" onClick={remove}>
                删除
              </Button>
              <Button size="small" onClick={() => setMode(Mode.Edit)}>
                编辑
              </Button>
            </div>
          }
        >
          <div class="flex gap-1 justify-end">
            <Button size="small" intent="primary" disabled={!isValidHref()} onClick={update}>
              保存
            </Button>
            <Button size="small" onClick={cancel}>
              取消
            </Button>
          </div>
        </Show>
      </div>
    </ContextProvider>
  );
}
