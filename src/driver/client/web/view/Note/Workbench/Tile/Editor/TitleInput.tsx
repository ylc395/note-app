import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import { EventNames } from '#domain/client/app/model/note/editor/events';
import { normalizeTitle } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';
import Workbench from '#domain/client/app/model/Workbench';

export default function TitleInput(props: { editor: BaseEditor }) {
  let inputRef: HTMLInputElement | undefined;
  const workbench = container.resolve(Workbench);
  const [title, setTitle] = createSignal('');
  const placeholder = createMemo(() =>
    title() || !props.editor.value.result.data
      ? undefined
      : normalizeTitle({ ...props.editor.value.result.data, title: '' }),
  );

  const shouldFocus = createMemo(
    () =>
      workbench.currentEditor === props.editor &&
      document.activeElement !== inputRef &&
      !props.editor.hasEdited &&
      props.editor.value.result.data &&
      !props.editor.value.result.data.body &&
      !props.editor.value.result.data.title,
  );

  createEffect(() => {
    if (props.editor.value.result.data) {
      setTitle(props.editor.value.result.data.title);
    }

    if (shouldFocus()) {
      inputRef?.focus();
    }
  });

  onCleanup(
    props.editor.events.on(EventNames.Focus, () => {
      if (shouldFocus()) {
        inputRef?.focus();
      }
    }),
  );

  return (
    <input
      spellcheck={false}
      ref={inputRef}
      class="block w-full outline-none h-12 px-4 text-lg border-b border-border-secondary shrink-0 placeholder:text-text-secondary"
      disabled={!props.editor.value.result.data}
      placeholder={placeholder()}
      value={title()} // solidjs 中,input 的 value 不受控。但在这里不影响程序的正确性 https://github.com/solidjs/solid/discussions/416
      onInput={(e) => {
        setTitle(e.target.value);
        props.editor.update({ title: e.target.value });
      }}
    />
  );
}
