import { autoUpdate, computePosition, flip, hide, inline } from '@floating-ui/dom';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { linkSchema, toggleLinkCommand, updateLinkCommand } from '@milkdown/kit/preset/commonmark';
import { posToDOMRect } from '@milkdown/kit/prose';
import { TextSelection } from '@milkdown/kit/prose/state';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { listenerCtx } from '@milkdown/kit/plugin/listener';
import { pull } from 'lodash-es';
import z from 'zod';

import { findMarkPosition } from '../../../shared/prosemirrorUtils';

export enum Mode {
  Preview = 'preview',
  Edit = 'edit',
  Add = 'add',
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
  onClose: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  onModeChange?: (mode: Mode) => void;
}) {
  const initialHref = props.targetDom instanceof HTMLAnchorElement ? props.targetDom.href : '';
  const editor = props.ctx.get(editorCtx);
  const editorView = props.ctx.get(editorViewCtx);

  const [href, setHref] = createSignal(initialHref);
  const [text, setText] = createSignal('');
  const [mode, setMode] = createSignal(props.initialMode ?? Mode.Preview);
  const isValidHref = createMemo(() => urlSchema.safeParse(href()).success);

  let inputRef: HTMLInputElement | undefined;
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();

  editor.action(() => {
    const listener = props.ctx.get(listenerCtx);
    listener.selectionUpdated(props.onClose);
  });

  onCleanup(() => {
    const listener = props.ctx.get(listenerCtx);
    pull(listener.listeners.selectionUpdated, props.onClose);
  });

  function action<T>(command: $Command<T>, payload?: T) {
    const markPos =
      props.targetDom instanceof HTMLElement
        ? selectLink(props.ctx, props.targetDom)
        : { start: editorView.state.selection.from, end: editorView.state.selection.to };

    if (!markPos) {
      return;
    }

    editor.action(callCommand(command.key, payload));
    editorView.dispatch(
      editorView.state.tr.setSelection(TextSelection.create(editorView.state.doc, markPos.start, markPos.end)),
    );
    editorView.focus();
    props.onClose?.();
  }

  function add() {
    if (!text()) {
      return;
    }

    const tr = editorView.state.tr;
    const linkMark = linkSchema.type(props.ctx).create({ href: href() });
    const { from, to, empty } = editorView.state.selection;

    if (empty) {
      if (!text()) return;
      tr.insertText(text(), from);
      tr.addMark(from, from + text().length, linkMark);
    } else {
      tr.addMark(from, to, linkMark);
    }
    editorView.dispatch(tr);
    editorView.focus();
    props.onClose?.();
  }

  function remove() {
    action(toggleLinkCommand);
  }

  function cancel() {
    if (props.initialMode === Mode.Edit || props.initialMode === Mode.Add) {
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

    if (mode() === Mode.Add) {
      return add();
    }

    const command = props.targetDom instanceof HTMLElement ? updateLinkCommand : toggleLinkCommand;
    action(command, { href: href() });
  }

  createEffect(() => {
    props.onModeChange?.(mode());

    if (mode() === Mode.Edit || mode() === Mode.Add) {
      requestAnimationFrame(() => {
        inputRef?.focus();
      });
    }
  });

  createEffect(() => {
    const root = rootRef();

    if (!root) {
      return;
    }

    const reference = props.targetDom || {
      contextElement: editorView.dom,
      getBoundingClientRect: () =>
        posToDOMRect(editorView, editorView.state.selection.anchor, editorView.state.selection.anchor),
    };

    const stopAutoUpdate = autoUpdate(reference, root, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(reference, root, {
        middleware: [
          hide({ boundary, strategy: 'escaped' }),
          flip({ boundary }),
          props.mousePosition && inline(props.mousePosition),
        ],
        placement: props.targetDom ? 'top' : 'bottom-start',
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
      classList={{ absolute: Boolean(props.targetDom) || mode() === Mode.Add }} //
    >
      <div>
        <input
          placeholder="URL"
          ref={inputRef}
          readOnly={mode() !== Mode.Edit && mode() !== Mode.Add}
          onInput={(e) => setHref(e.target.value)}
          value={href()}
        />
      </div>
      <Show when={mode() === Mode.Add}>
        <div>
          <input placeholder="文字" value={text()} onInput={(e) => setText(e.target.value)} />
        </div>
      </Show>
      <Show
        when={mode() === Mode.Edit || mode() === Mode.Add}
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
