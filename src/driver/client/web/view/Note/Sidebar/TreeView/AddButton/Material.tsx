import { Show } from 'solid-js';
import { PlusIcon, FolderPlusIcon, FilePlus, ChevronDownIcon } from 'lucide-solid';
import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';

import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';
import type { NoteVO } from '#domain/shared/model/note';

export default function ButtonGroup(props: { iconOnly?: boolean; noteId?: NoteVO['id']; triggerClassName?: string }) {
  const {
    treeViews: { material: treeView },
    toggleMaterialForm,
  } = container.resolve(NoteService);

  function onFormSubmit() {
    if (props.noteId) {
      treeView.tree.expand(props.noteId);
    }
  }

  function onSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'file':
        return toggleMaterialForm({ parentId: props.noteId, onSubmit: onFormSubmit });
      case 'directory':
        return treeView.newNoteEditor?.init({ parentId: props.noteId });
      default:
        throw new Error('invalid value');
    }
  }

  return (
    <Menu.Root lazyMount unmountOnExit closeOnSelect onSelect={onSelect}>
      <Menu.Trigger class={`flex ${props.triggerClassName ?? ''}`} onClick={(e) => e.stopPropagation()}>
        <PlusIcon />
        <Show when={!props.iconOnly}>
          新建
          <ChevronDownIcon />
        </Show>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="flex flex-col bg-white z-50">
          <Menu.Item
            onClick={(e) => e.stopPropagation()}
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
            onClick={(e) => e.stopPropagation()}
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
