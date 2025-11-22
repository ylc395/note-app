import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';

import Editor from './Editor';

export default function MarkdownEditor(props: {
  readonly?: boolean;
  className?: string;
  ref?: (value: Editor) => void;
  /** 以下 prop 不具有响应性 */
  defaultValue?: string;
  editorRootClass?: string;
  focusWhenEditable?: boolean;
  onUpdate?: (md: string) => void; // 仅当焦点在该 editor 时触发
}) {
  let rootRef: HTMLDivElement | undefined;
  const [getEditor, setEditor] = createSignal<Editor>();

  onMount(() => {
    const { defaultValue, onUpdate } = props;
    const editor = new Editor({
      defaultValue,
      root: rootRef!,
      editable: !props.readonly,
      editorRootClassName: props.editorRootClass,
    });

    if (onUpdate) {
      editor.on((listener) => listener.markdownUpdated((_, markdown) => editor.hasFocus() && onUpdate(markdown)));
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

        if (!isReadonly && props.focusWhenEditable) {
          editor.focus();
        }
      },
    ),
  );

  onCleanup(() => {
    getEditor()?.destroy();
  });

  return <div class={props.className} spellcheck={false} ref={rootRef}></div>;
}
