import { autoUpdate, computePosition, hide, inline } from '@floating-ui/dom';
import { editorCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { linkSchema, toggleLinkCommand, updateLinkCommand } from '@milkdown/kit/preset/commonmark';
import { TextSelection } from '@milkdown/kit/prose/state';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { createEffect, createMemo, createSignal, onCleanup, Show, type JSX } from 'solid-js';
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

  const current = editorView.state.selection.getBookmark();

  editorView.dispatch(
    editorView.state.tr.setSelection(TextSelection.create(editorView.state.doc, markPos.start, markPos.end)),
  );

  return current;
}

const urlSchema = z.url();

export default function View(props: {
  ctx: Ctx;
  mousePosition: { x: number; y: number };
  targetDom: HTMLElement;
  initialHref?: string;
  onModeChange: (mode: Mode) => void;
  onUpdate: () => void;
}) {
  const [href, setHref] = createSignal(props.initialHref ?? '');
  const [mode, setMode] = createSignal<Mode>(Mode.Preview);
  const [tooltipStyle, setTooltipStyle] = createSignal<JSX.CSSProperties>();
  const isValidHref = createMemo(() => urlSchema.safeParse(href()).success);

  let tooltipRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    props.onModeChange(mode());
  });

  createEffect(() => {
    if (!tooltipRef) {
      return;
    }

    const cleanup = autoUpdate(props.targetDom, tooltipRef, async () => {
      const { x, y, middlewareData } = await computePosition(props.targetDom, tooltipRef, {
        middleware: [hide(), inline(props.mousePosition)],
        placement: 'top',
      });

      setTooltipStyle({
        left: `${x}px`,
        top: `${y}px`,
        visibility: middlewareData.hide?.referenceHidden ? 'hidden' : 'visible',
      });
    });

    onCleanup(cleanup);
  });

  function action<T>(command: $Command<T>, payload?: T) {
    const originSelection = selectLink(props.ctx, props.targetDom);

    if (!originSelection) {
      return;
    }

    props.ctx.get(editorCtx).action(callCommand(command.key, payload));

    const editorView = props.ctx.get(editorViewCtx);
    editorView.dispatch(editorView.state.tr.setSelection(originSelection.resolve(editorView.state.doc)));

    props.onUpdate();
  }

  function reset() {
    setHref(props.initialHref ?? '');
    setMode(Mode.Preview);
  }

  function remove() {
    action(toggleLinkCommand);
  }

  function update() {
    if (!href()) {
      remove();
      return;
    }

    action(updateLinkCommand, { href: href() });
  }

  function edit() {
    setMode(Mode.Edit);
    inputRef?.focus();
  }

  return (
    <div class="absolute" ref={tooltipRef} style={tooltipStyle()}>
      <input ref={inputRef} readOnly={mode() !== Mode.Edit} onInput={(e) => setHref(e.target.value)} value={href()} />
      <Show
        when={mode() === Mode.Edit}
        fallback={
          <div>
            <button onClick={remove}>删除</button>
            <button onClick={edit}>编辑</button>
          </div>
        }
      >
        <div>
          <button disabled={!isValidHref()} onClick={update}>
            保存
          </button>
          <button onClick={reset}>取消</button>
        </div>
      </Show>
    </div>
  );
}
