import { createMemo, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { PlusIcon, FolderPlusIcon, FilePlus, ChevronDownIcon } from 'lucide-solid';
import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import shell from '#web/infra/shell';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import { NoteTypes } from '#domain/shared/model/note';

export default function ButtonGroup(props: { iconOnly?: boolean; buttonClassName?: string; node?: TreeNode }) {
  const { toggleMaterialForm, getOrCreateTreeView } = container.resolve(NoteService);
  const treeView = getOrCreateTreeView(NoteTypes.Material);
  const node = createMemo(() => props.node ?? treeView.tree.root);

  function onFormSubmit() {
    const _node = node();

    if (_node) {
      _node.toggleExpand(true);
    }
  }

  function onSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'file':
        return toggleMaterialForm({
          parent: node()?.value,
          onSubmit: onFormSubmit,
        });
      case 'directory':
        return treeView.initNewNoteForm({ parentId: node()?.value?.id });
      default:
        throw new Error('invalid value');
    }
  }

  return (
    <Menu.Root lazyMount unmountOnExit closeOnSelect onSelect={onSelect} positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger class={props.buttonClassName} onClick={(e) => e.stopPropagation()}>
        <PlusIcon />
        <Show when={!props.iconOnly}>
          新建
          <ChevronDownIcon />
        </Show>
      </Menu.Trigger>
      <Portal mount={shell.appRoot}>
        <Menu.Positioner>
          <Menu.Content
            asChild={(childProps) => (
              <ul {...childProps()} class="p-0 menu bg-base-200 rounded-lg">
                <Menu.Item
                  onClick={(e) => e.stopPropagation()}
                  value="file"
                  asChild={(childProps) => (
                    <li {...childProps()}>
                      <button class="btn btn-ghost btn-sm">
                        <FilePlus class="mr-1" />
                        新增文件
                      </button>
                    </li>
                  )}
                />
                <Menu.Item
                  value="directory"
                  onClick={(e) => e.stopPropagation()}
                  asChild={(childProps) => (
                    <li {...childProps()}>
                      <button class="btn btn-ghost btn-sm">
                        <FolderPlusIcon class="mr-1" />
                        新增目录
                      </button>
                    </li>
                  )}
                />
              </ul>
            )}
          />
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
