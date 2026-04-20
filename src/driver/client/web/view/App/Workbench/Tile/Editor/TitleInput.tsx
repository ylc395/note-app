import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import assert from 'assert';
import { SmilePlusIcon } from 'lucide-solid';
import { Menu } from '@ark-ui/solid';

import NoteBaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import Button from '#web/view/components/Button';
import Icon from '#web/view/components/Icon';
import { useContext } from './composables';
import IconPicker from '#web/view/components/IconPicker';

export default function TitleInput() {
  let inputRef: HTMLInputElement | undefined;
  const [title, setTitle] = createSignal('');
  const [isIconPickerOpen, setIconPickerOpen] = createSignal(false);

  const editor = createMemo(() => {
    const value = useContext()!.editor;
    assert(value instanceof NoteBaseEditor);

    return value;
  });

  const placeholder = createMemo(() => title() || editor().title || '');

  createEffect(() => {
    if (editor().value.data) {
      setTitle(editor().value.data!.title);
    }

    if (!editor().hasEdited && editor().value.data && !editor().value.data!.body && !editor().value.data!.title) {
      inputRef?.focus();
    }
  });

  createEffect(() => {
    if (editor().value.data && title() !== editor().value.data!.title) {
      editor().update({ title: title() });
    }
  });

  return (
    <div class="flex items-center border-b border-border-secondary px-2">
      <Menu.Root unmountOnExit lazyMount open={isIconPickerOpen()} onOpenChange={({ open }) => setIconPickerOpen(open)}>
        <Menu.Trigger>
          <Button square>
            <Show when={editor().icon} fallback={<SmilePlusIcon />}>
              {(icon) => <Icon icon={icon()} />}
            </Show>
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <IconPicker className="z-10" iconManager={editor().iconManager} onFinish={() => setIconPickerOpen(false)} />
        </Menu.Positioner>
      </Menu.Root>
      <input
        spellcheck={false}
        ref={inputRef}
        class="grow h-12 px-2 text-lg shrink-0 placeholder:text-fg-secondary"
        disabled={!editor().value.result.data}
        placeholder={placeholder()}
        value={title()} // solidjs 中,input 的 value 不受控。但在这里不影响程序的正确性 https://github.com/solidjs/solid/discussions/416
        onInput={(e) => setTitle(e.target.value)}
      />
    </div>
  );
}
