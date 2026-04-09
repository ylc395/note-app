import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';

import Editor from './Editor';
import clsx from 'clsx';

export default function MarkdownEditor(props: {
  readonly?: boolean;
  className?: string;
  onScrollEnd?: (e: { x: number; y: number }) => void;
  ref?: (value: Editor) => void;
  /** 以下 prop 不具有响应性 */
  defaultValue?: string;
  initialScroll?: { x: number; y: number };
  initialCursorPos?: { anchor: number; head: number };
  onUpdate?: (md: string) => void;
  onSelectionUpdate?: (pos: { anchor: number; head: number }) => void;
}) {
  let rootRef: HTMLDivElement | undefined;
  const [getEditor, setEditor] = createSignal<Editor>();

  onMount(() => {
    const { defaultValue, onUpdate, onSelectionUpdate } = props;
    const editor = new Editor({
      defaultValue,
      root: rootRef!,
      readonly: props.readonly,
    });

    if (onUpdate) {
      editor.on((listener) => listener.markdownUpdated((_, markdown) => onUpdate(markdown)));
    }

    if (onSelectionUpdate) {
      editor.on((listener) =>
        listener.selectionUpdated((_, { anchor, head }) => {
          if (editor.isCreated) {
            onSelectionUpdate({ anchor, head });
          }
        }),
      );
    }

    editor.onStatusChange(() => {
      if (!editor.isCreated) {
        return;
      }

      if (props.initialScroll) {
        rootRef!.scrollTo(props.initialScroll.x, props.initialScroll.y);
      }

      if (props.initialCursorPos) {
        try {
          editor.setSelection(props.initialCursorPos);
          editor.focus();
        } catch {
          return;
        }
      }
    });

    editor.init();
    setEditor(editor);
  });

  createEffect(() => {
    const editor = getEditor();

    if (editor) {
      props.ref?.(editor);
    }
  });

  createEffect(
    on(
      () => props.readonly,
      (isReadonly) => {
        const editor = getEditor();

        if (!editor || typeof isReadonly !== 'boolean') {
          return;
        }

        editor.setReadonly(isReadonly);
      },
    ),
  );

  onCleanup(() => {
    getEditor()?.destroy();
  });

  return (
    <div
      class={clsx(props.className, 'select-text')}
      spellcheck={false}
      ref={rootRef}
      onScrollEnd={props.onScrollEnd && (() => props.onScrollEnd?.({ x: rootRef!.scrollLeft, y: rootRef!.scrollTop }))}
    ></div>
  );
}
