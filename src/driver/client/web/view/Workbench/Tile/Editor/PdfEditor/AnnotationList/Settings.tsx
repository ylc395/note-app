import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';
import { CheckSquare2Icon, SettingsIcon, SquareIcon } from 'lucide-solid';
import { action } from 'mobx';
import { createMemo } from 'solid-js';
import assert from 'assert';

import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import { useContext } from '../../context';

export default function Settings() {
  const ctx = useContext()!;
  const editor = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);
    return ctx.editor;
  });

  function handleSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'toggleNative':
        editor().annotation.toggleNative();
        break;
      default:
        break;
    }
  }

  return (
    <Menu.Root onSelect={action(handleSelect)}>
      <Menu.Trigger>
        <SettingsIcon />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.CheckboxItem
            class="group flex items-center"
            value="toggleNative"
            checked={editor().annotation.shouldShowNative}
          >
            <SquareIcon class='hidden mr-1 group-data-[state="unchecked"]:block' />
            <CheckSquare2Icon class='hidden mr-1 group-data-[state="checked"]:block' />
            显示文档内置的标注
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
