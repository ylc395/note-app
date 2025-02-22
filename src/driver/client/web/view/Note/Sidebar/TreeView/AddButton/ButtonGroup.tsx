import { PlusIcon, FolderPlusIcon, FilePlus, ChevronDownIcon } from 'lucide-solid';
import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';

import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';

export default function ButtonGroup() {
  const { treeViews } = container.resolve(NoteService);

  function onSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'file':
      case 'directory':
        return treeViews.material.newNoteEditor.create({ parentId: null });
      default:
        throw new Error('invalid value');
    }
  }

  return (
    <Menu.Root lazyMount unmountOnExit closeOnSelect onSelect={onSelect}>
      <Menu.Trigger class="flex">
        <PlusIcon />
        新建
        <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="flex flex-col">
          <Menu.Item
            value="file"
            asChild={(props) => (
              <button {...props()}>
                <FilePlus />
                新增文件
              </button>
            )}
          ></Menu.Item>
          <Menu.Item
            value="directory"
            asChild={(props) => (
              <button {...props()}>
                <FolderPlusIcon />
                新增目录
              </button>
            )}
          ></Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
