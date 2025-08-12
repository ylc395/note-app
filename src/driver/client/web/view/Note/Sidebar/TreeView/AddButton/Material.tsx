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

  function onSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'file':
        return toggleMaterialForm({
          parent: node()?.value,
          onSubmit: () => {
            node()?.toggleExpand(true);
          },
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
        <Menu.Positioner class="absolute">
          <Menu.Content class="rounded border-border-primary border p-inset-square-s bg-brand-secondary shadow">
            <Menu.Item
              value="directory"
              onClick={(e) => e.stopPropagation()}
              asChild={(props) => (
                <button {...props()} class="button button-md">
                  <FolderPlusIcon class="mr-1" />
                  新增目录
                </button>
              )}
            />
            <Menu.Item
              onClick={(e) => e.stopPropagation()}
              value="file"
              asChild={(props) => (
                <button {...props()} class="button button-md">
                  <FilePlus class="mr-1" />
                  新增文件
                </button>
              )}
            />
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
