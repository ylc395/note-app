import { PlusIcon, FolderPlusIcon, FilePlus, ChevronDownIcon } from 'lucide-solid';
import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';

import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';
import type { NoteVO } from '#domain/shared/model/note';
import { Show } from 'solid-js';

export default function ButtonGroup(props: { iconOnly?: boolean; noteId?: NoteVO['id'] }) {
  const { treeViews, toggleMaterialForm } = container.resolve(NoteService);

  function onSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'file':
        return toggleMaterialForm(props.noteId);
      case 'directory':
        return treeViews.material.newNoteEditor?.create({ parentId: props.noteId });
      default:
        throw new Error('invalid value');
    }
  }

  return (
    <Menu.Root lazyMount unmountOnExit closeOnSelect onSelect={onSelect}>
      <Menu.Trigger class="flex">
        <PlusIcon />
        <Show when={!props.iconOnly}>
          新建
          <ChevronDownIcon />
        </Show>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="flex flex-col bg-white">
          <Menu.Item
            value="file"
            asChild={(childProps) => (
              <button {...childProps()} class="flex items-center p-2">
                <FilePlus class="mr-1" />
                新增文件
              </button>
            )}
          ></Menu.Item>
          <Menu.Item
            value="directory"
            asChild={(childProps) => (
              <button {...childProps()} class="flex items-center p-2">
                <FolderPlusIcon class="mr-1" />
                新增目录
              </button>
            )}
          ></Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
