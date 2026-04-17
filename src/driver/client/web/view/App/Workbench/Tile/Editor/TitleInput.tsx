import { createEffect, createMemo, createSignal } from 'solid-js';
import assert from 'assert';
import NoteBaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import { useContext } from './context';

export default function TitleInput() {
  let inputRef: HTMLInputElement | undefined;
  const [title, setTitle] = createSignal('');
  const ctx = useContext()!;
  const placeholder = createMemo(() => title() || ctx.editor.title || '');

  createEffect(() => {
    assert(ctx.editor instanceof NoteBaseEditor);

    if (ctx.editor.value.result.data) {
      setTitle(ctx.editor.value.result.data.title);
    }

    if (
      !ctx.editor.hasEdited &&
      ctx.editor.value.result.data &&
      !ctx.editor.value.result.data.body &&
      !ctx.editor.value.result.data.title
    ) {
      inputRef?.focus();
    }
  });

  createEffect(() => {
    assert(ctx.editor instanceof NoteBaseEditor);

    if (ctx.editor.value.result.data && title() !== ctx.editor.value.result.data.title) {
      ctx.editor.update({ title: title() });
    }
  });

  return (
    <input
      spellcheck={false}
      ref={inputRef}
      class="block w-full outline-none h-12 px-4 text-lg border-b border-border-secondary shrink-0 placeholder:text-fg-secondary"
      disabled={!ctx.editor.value.result.data}
      placeholder={placeholder()}
      value={title()} // solidjs 中,input 的 value 不受控。但在这里不影响程序的正确性 https://github.com/solidjs/solid/discussions/416
      onInput={(e) => setTitle(e.target.value)}
    />
  );
}
