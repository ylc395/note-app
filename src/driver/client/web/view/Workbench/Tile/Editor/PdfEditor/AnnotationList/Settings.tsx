import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';
import { CheckSquare2Icon, SettingsIcon, SquareIcon } from 'lucide-solid';
import { action } from 'mobx';

import type PdfViewer from '../PDFViewer';

export default function Settings(props: { viewer: PdfViewer }) {
  function handleSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'toggleNative':
        props.viewer.editor.annotation.state.set('native', !props.viewer.editor.annotation.state.get('native'));
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
            checked={props.viewer.editor.annotation.state.get('native') ?? true}
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
