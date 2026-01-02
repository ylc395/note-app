import { autoUpdate, computePosition, flip, hide, inline } from '@floating-ui/dom';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { linkSchema, toggleLinkCommand, updateLinkCommand } from '@milkdown/kit/preset/commonmark';
import { TextSelection } from '@milkdown/kit/prose/state';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import z from 'zod';
import { findMarkPosition } from '../../../shared/prosemirrorUtils';

export enum Mode {
  Preview = 'preview',
  Edit = 'edit',
}

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
  mousePosition?: { x: number; y: number };
  initialMode?: Mode;
  onClose?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  onModeChange?: (mode: Mode) => void;
}) {
  const initialHref = props.targetDom instanceof HTMLAnchorElement ? props.targetDom.href : '';

  const [href, setHref] = createSignal(initialHref);
  const [mode, setMode] = createSignal(props.initialMode ?? Mode.Preview);
  const isValidHref = createMemo(() => urlSchema.safeParse(href()).success);

  let inputRef: HTMLInputElement | undefined;
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();

  function action<T>(command: $Command<T>, payload?: T) {
    const editorView = props.ctx.get(editorViewCtx);
    const markPos =
      props.targetDom instanceof HTMLElement
        ? selectLink(props.ctx, props.targetDom)
        : { start: editorView.state.selection.from, end: editorView.state.selection.to };

    if (!markPos) {
      return;
    }

    props.ctx.get(editorCtx).action(callCommand(command.key, payload));
    editorView.dispatch(
      editorView.state.tr.setSelection(TextSelection.create(editorView.state.doc, markPos.start, markPos.end)),
    );
    editorView.focus();

    props.onClose?.();
  }

  function remove() {
    action(toggleLinkCommand);
  }

  function cancel() {
    if (props.initialMode === Mode.Edit) {
      props.onClose?.();
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
    const root = rootRef();

    if (!root || !props.targetDom) {
      return;
    }

    const stopAutoUpdate = autoUpdate(props.targetDom, root, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(props.targetDom!, root, {
        middleware: [
          hide({ boundary, strategy: 'escaped' }),
          flip({ boundary }),
          props.mousePosition && inline(props.mousePosition),
        ],
        placement: 'top',
      });

      Object.assign(root.style, {
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
    <div
      ref={setRootRef}
      onFocusOut={props.onLeave}
      onMouseLeave={props.onLeave}
      onMouseEnter={props.onEnter}
      classList={{ absolute: Boolean(props.targetDom) }}
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
  );
}
