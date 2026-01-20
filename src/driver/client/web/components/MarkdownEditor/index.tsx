import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';

import Editor from './Editor';
import clsx from 'clsx';

export default function MarkdownEditor(props: {
  readonly?: boolean;
  className?: string;
  ref?: (value: Editor) => void;
  /** 以下 prop 不具有响应性 */
  defaultValue?: string;
  onUpdate?: (md: string) => void;
}) {
  let rootRef: HTMLDivElement | undefined;
  const [getEditor, setEditor] = createSignal<Editor>();

  onMount(() => {
    const { defaultValue, onUpdate } = props;
    const editor = new Editor({
      defaultValue,
      root: rootRef!,
      readonly: props.readonly,
    });

    if (onUpdate) {
      editor.on((listener) => listener.markdownUpdated((_, markdown) => onUpdate(markdown)));
    }

    editor.init();
    setEditor(editor);
    props.ref?.(editor);
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

  return <div class={clsx(props.className, 'select-text')} spellcheck={false} ref={rootRef}></div>;
}
