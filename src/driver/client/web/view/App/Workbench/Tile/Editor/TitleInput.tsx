import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import assert from 'assert';
import { SmilePlusIcon } from 'lucide-solid';
import { Popover } from '@ark-ui/solid';

import NoteBaseEditor from '#domain/client/app/model/Workbench/noteEditor/BaseEditor';
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
    if (editor().entity.value.data && title() !== editor().entity.value.data!.title) {
      editor().update({ title: title() });
    }
  });

  return (
    <div class="flex items-center border-b border-border-secondary px-2">
      <Popover.Root
        unmountOnExit
        lazyMount
        open={isIconPickerOpen()}
        onOpenChange={({ open }) => setIconPickerOpen(open)}
      >
        <Popover.Trigger>
          <Button square>
            <Show when={editor().icon} fallback={<SmilePlusIcon />}>
              {(icon) => <Icon icon={icon()} />}
            </Show>
          </Button>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content class="z-10">
            <IconPicker
              currentIcon={editor().icon}
              iconManager={editor().iconManager}
              onFinish={() => setIconPickerOpen(false)}
            />
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
      <input
        spellcheck={false}
        ref={inputRef}
        class="grow h-12 px-2 text-lg shrink-0 placeholder:text-fg-tertiary"
        disabled={!editor().entity.value.data}
        placeholder={placeholder()}
        value={title()} // solidjs 中,input 的 value 不受控。但在这里不影响程序的正确性 https://github.com/solidjs/solid/discussions/416
        onInput={(e) => setTitle(e.target.value)}
      />
    </div>
  );
}
