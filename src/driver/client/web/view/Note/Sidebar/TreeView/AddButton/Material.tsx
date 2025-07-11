import { Show } from 'solid-js';
import { PlusIcon, FolderPlusIcon, FilePlus, ChevronDownIcon } from 'lucide-solid';
import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import type { NoteVO } from '#domain/shared/model/note';
import { Portal } from 'solid-js/web';
import shell from '#web/infra/shell';

export default function ButtonGroup(props: { iconOnly?: boolean; note?: NoteVO; triggerClassName?: string }) {
  const {
    treeViews: { material: treeView },
    toggleMaterialForm,
  } = container.resolve(NoteService);

  function onFormSubmit() {
    if (props.note) {
      treeView.tree.expand(props.note.id);
    }
  }

  function onSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'file':
        return toggleMaterialForm({ parent: props.note, onSubmit: onFormSubmit });
      case 'directory':
        return treeView.newNoteEditor?.init({ parentId: props.note?.id });
      default:
        throw new Error('invalid value');
    }
  }

  return (
    <Menu.Root lazyMount unmountOnExit closeOnSelect onSelect={onSelect} positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger class={`flex ${props.triggerClassName ?? ''}`} onClick={(e) => e.stopPropagation()}>
        <PlusIcon />
        <Show when={!props.iconOnly}>
          新建
          <ChevronDownIcon />
        </Show>
      </Menu.Trigger>
      <Portal mount={shell.appRoot}>
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
      </Portal>
    </Menu.Root>
  );
}
