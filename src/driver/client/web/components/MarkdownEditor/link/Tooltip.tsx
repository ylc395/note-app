import shell from '#web/infra/shell';
import { autoUpdate, computePosition, flip, hide as hideFloating, inline } from '@floating-ui/dom';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { linkSchema, toggleLinkCommand, updateLinkCommand } from '@milkdown/kit/preset/commonmark';
import { TextSelection } from '@milkdown/kit/prose/state';
import { callCommand, type $Command } from '@milkdown/kit/utils';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { makeEventListener } from '@solid-primitives/event-listener';
import z from 'zod';
import { debounce } from 'lodash-es';
import { findMarkPosition } from '../shared/prosemirrorUtils';

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
  initialMode?: Mode;
  onClose?: () => void;
}) {
  const initialHref = props.targetDom instanceof HTMLAnchorElement ? props.targetDom.href : '';
  const isFloating = Boolean(props.targetDom);

  const [href, setHref] = createSignal(initialHref);
  const [mode, setMode] = createSignal(props.initialMode ?? Mode.Preview);
  const [shouldShow, setShouldShow] = createSignal(!isFloating);
  const [mousePosition, setMousePosition] = createSignal<{ x: number; y: number }>();

  const editorView = createMemo(() => props.ctx.get(editorViewCtx));
  const isValidHref = createMemo(() => urlSchema.safeParse(href()).success);

  let inputRef: HTMLInputElement | undefined;
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();

  const hideDelay = debounce(hide, 600);

  const show = (e: MouseEvent) => {
    hideDelay.cancel();
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShouldShow(true);
  };

  const onClose = () => {
    if (props.onClose) {
      props.onClose();
    } else {
      hide();
    }
  };

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
    onClose();
  }

  function remove() {
    action(toggleLinkCommand);
  }

  function cancel() {
    if (props.initialMode === Mode.Edit) {
      onClose();
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

  function hide() {
    if (mode() !== Mode.Edit) {
      setShouldShow(false);
    }
  }

  createEffect(() => {
    if (mode() === Mode.Edit && shouldShow()) {
      inputRef?.focus();
    }
  });

  createEffect(() => {
    const root = rootRef();

    if (!root || !shouldShow() || !props.targetDom) {
      return;
    }

    const stopAutoUpdate = autoUpdate(props.targetDom, root, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(props.targetDom!, root, {
        middleware: [
          hideFloating({ boundary, strategy: 'escaped' }),
          flip({ boundary }),
          mousePosition() && inline(mousePosition()),
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

  if (props.targetDom) {
    makeEventListener(props.targetDom, 'mouseenter', show);
    makeEventListener(props.targetDom, 'mouseleave', hideDelay);
  }

  onCleanup(() => {
    hideDelay.cancel();
  });

  const content = (
    <div
      ref={setRootRef}
      onFocusOut={hideDelay}
      onMouseLeave={hideDelay}
      onMouseEnter={show}
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

  return (
    <Show when={shouldShow()}>{props.targetDom ? <Portal mount={shell.appRoot}>{content}</Portal> : content}</Show>
  );
}
