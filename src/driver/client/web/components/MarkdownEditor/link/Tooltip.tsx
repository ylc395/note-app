import shell from '#web/infra/shell';
import { autoUpdate, computePosition, flip, hide, inline, type VirtualElement } from '@floating-ui/dom';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { linkSchema, toggleLinkCommand, updateLinkCommand } from '@milkdown/kit/preset/commonmark';
import { TextSelection } from '@milkdown/kit/prose/state';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import z from 'zod';

export enum Mode {
  Preview = 'preview',
  Edit = 'edit',
}

// 从 milkdown 仓库里复制的
function findMarkPosition(ctx: Ctx, linkDom: HTMLElement) {
  const editorView = ctx.get(editorViewCtx);
  const pos = editorView.posAtDOM(linkDom, 0);
  const node = editorView.state.doc.nodeAt(pos);
  const $pos = editorView.state.doc.resolve(pos);
  const mark = node?.marks.find((mark) => mark.type === linkSchema.mark.type(ctx));

  if (!mark || !node) {
    return;
  }

  let markPos = { start: -1, end: -1 };
  editorView.state.doc.nodesBetween($pos.before(), $pos.after(), (n, pos) => {
    if (markPos.start > -1) return false;

    if (markPos.start === -1 && mark.isInSet(n.marks) && node === n) {
      markPos = {
        start: pos,
        end: pos + Math.max(n.textContent.length, 1),
      };
    }

    return undefined;
  });

  return markPos;
}

function selectLink(ctx: Ctx, linkDom: HTMLElement) {
  const editorView = ctx.get(editorViewCtx);
  const markPos = findMarkPosition(ctx, linkDom);

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
  targetDom: HTMLAnchorElement | VirtualElement;
  mousePosition?: { x: number; y: number };
  close: () => void;
  initialMode?: Mode;
  onLeave?: () => void;
  onEnter?: () => void;
  onModeChange?: (mode: Mode) => void;
}) {
  const initialHref = props.targetDom instanceof HTMLAnchorElement ? props.targetDom.href : '';
  const [href, setHref] = createSignal(initialHref);
  const [mode, setMode] = createSignal(props.initialMode ?? Mode.Preview);

  const editorView = createMemo(() => props.ctx.get(editorViewCtx));
  const isValidHref = createMemo(() => urlSchema.safeParse(href()).success);

  let inputRef: HTMLInputElement | undefined;
  let rootRef: HTMLDivElement | undefined;

  function action<T>(command: $Command<T>, payload?: T) {
    const markPos =
      props.targetDom instanceof HTMLElement
        ? selectLink(props.ctx, props.targetDom)
        : { start: editorView().state.selection.from, end: editorView().state.selection.to };

    if (!markPos) {
      return;
    }

    props.ctx.get(editorCtx).action(callCommand(command.key, payload));

    editorView().dispatch(
      editorView().state.tr.setSelection(TextSelection.create(editorView().state.doc, markPos.start, markPos.end)),
    );

    editorView().focus();
    props.close();
  }

  function remove() {
    action(toggleLinkCommand);
  }

  function cancel() {
    if (props.initialMode === Mode.Edit) {
      props.close();
    } else {
      setHref(initialHref);
      setMode(Mode.Preview);
    }
  }

  function update() {
    if (!isValidHref()) {
      return;
    }

    action(props.targetDom instanceof HTMLElement ? updateLinkCommand : toggleLinkCommand, { href: href() });
  }

  createEffect(() => {
    props.onModeChange?.(mode());

    if (mode() === Mode.Edit) {
      inputRef?.focus();
    }
  });

  createEffect(() => {
    if (!rootRef) {
      return;
    }

    const stopAutoUpdate = autoUpdate(props.targetDom, rootRef, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(props.targetDom, rootRef, {
        middleware: [
          hide({ boundary, strategy: 'escaped' }),
          flip({ boundary }),
          props.mousePosition && inline(props.mousePosition),
        ],
        placement: 'top',
      });

      Object.assign(rootRef!.style, {
        left: `${x}px`,
        top: `${y}px`,
        display: middlewareData.hide?.escaped ? 'none' : '',
      });
    });

    onCleanup(() => {
      stopAutoUpdate();
    });
  });

  return (
    <Portal mount={shell.appRoot}>
      <div
        ref={rootRef}
        onFocusOut={props.onLeave}
        onMouseLeave={props.onLeave}
        onMouseEnter={props.onEnter}
        class="absolute"
      >
        <input ref={inputRef} readOnly={mode() !== Mode.Edit} onInput={(e) => setHref(e.target.value)} value={href()} />
        <Show
          when={mode() === Mode.Edit}
          fallback={
            <div>
              <button onClick={remove}>删除</button>
              <button onClick={() => setMode(Mode.Edit)}>编辑</button>
            </div>
          }
        >
          <div>
            <button disabled={!isValidHref()} onClick={update}>
              保存
            </button>
            <button onClick={cancel}>取消</button>
          </div>
        </Show>
      </div>
    </Portal>
  );
}
