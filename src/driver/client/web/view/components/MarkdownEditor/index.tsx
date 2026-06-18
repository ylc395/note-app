import { createEffect, createSignal, on, onCleanup, onMount, Show } from 'solid-js';
import { cx } from 'class-variance-authority';

import Editor from './Editor';
import type { Options as SearchOptions } from './search';
import SearchBar, { type SearchChangeInfo } from './search/SearchBar';

export default function MarkdownEditor(props: {
  readonly?: boolean;
  className?: string;
  onScrollEnd?: (e: { x: number; y: number }) => void;
  onSearchClose?: () => void;
  onSearchChange?: (info: SearchChangeInfo) => void;
  ref?: (value: Editor) => void;
  showSearch?: boolean;
  /** 以下 prop 不具有响应性 */
  defaultValue?: string;
  defaultSearchOptions?: SearchOptions;
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
      defaultSearchOptions: { ...props.defaultSearchOptions, defaultOpen: props.showSearch },
      root: rootRef!,
      readonly: props.readonly,
    });

    if (onUpdate) {
      editor.on((listener) => listener.markdownUpdated((_, markdown) => onUpdate(markdown)));
    }

    if (onSelectionUpdate) {
      editor.on((listener) =>
        listener.selectionUpdated((_, { anchor, head }) => {
          if (editor.isReady) {
            onSelectionUpdate({ anchor, head });
          }
        }),
      );
    }

    editor.init();
    setEditor(editor);
  });

  createEffect(
    on(
      () => getEditor()?.isReady,
      (isReady) => {
        if (isReady) {
          if (props.initialScroll) {
            rootRef!.scrollTo(props.initialScroll.x, props.initialScroll.y);
          }

          if (props.initialCursorPos) {
            try {
              getEditor()!.setSelection(props.initialCursorPos);
              getEditor()!.focus();
            } catch {
              return;
            }
          }
        }
      },
    ),
  );

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
    <div class={cx('relative', props.className)}>
      <Show when={props.showSearch && getEditor()}>
        <SearchBar editor={getEditor()!} onClose={props.onSearchClose} onSearchChange={props.onSearchChange} />
      </Show>
      <div
        class="select-text"
        spellcheck={false}
        ref={rootRef}
        onScrollEnd={
          props.onScrollEnd && (() => props.onScrollEnd?.({ x: rootRef!.scrollLeft, y: rootRef!.scrollTop }))
        }
      ></div>
    </div>
  );
}
