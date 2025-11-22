import { createMemo, Show } from 'solid-js';
import { PlusIcon, FilePlusIcon, Grid2x2PlusIcon, ChevronDownIcon } from 'lucide-solid';
import { Menu, type MenuSelectionDetails } from '@ark-ui/solid';
import type { Placement } from '@floating-ui/dom';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';

export default function ButtonGroup(props: {
  iconOnly?: boolean;
  buttonClassName: string;
  node?: TreeNode;
  menuPlacement: Placement;
}) {
  const { newMaterialForm, explorer: treeView, createNote } = container.resolve(NoteService);
  const node = createMemo(() => props.node ?? treeView.tree?.root);

  async function onSelect({ value }: MenuSelectionDetails) {
    switch (value) {
      case 'file':
        return newMaterialForm.initForm({
          path: props.node && [...(node()?.ancestors ?? []), props.node],
          onSubmit: () => {
            node()?.toggleExpand(true);
          },
        });
      case 'text':
        await createNote({ parentId: node()?.value?.id });
        node()?.toggleExpand(true);
        return;
      default:
        throw new Error('invalid value');
    }
  }

  return (
    <Menu.Root
      lazyMount
      unmountOnExit
      closeOnSelect
      onSelect={onSelect}
      positioning={{ placement: props.menuPlacement }}
    >
      <Menu.Trigger class={props.buttonClassName} onClick={(e) => e.stopPropagation()}>
        <PlusIcon />
        <Show when={!props.iconOnly}>
          新建
          <ChevronDownIcon />
        </Show>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="menu text-text-secondary">
          <Menu.Item
            onClick={(e) => e.stopPropagation()}
            value="text"
            asChild={(props) => (
              <button {...props()} class="button button-md">
                <FilePlusIcon class="mr-1" />
                新增文本
              </button>
            )}
          />
          <Menu.Item
            value="file"
            onClick={(e) => e.stopPropagation()}
            asChild={(props) => (
              <button {...props()} class="button button-md">
                <Grid2x2PlusIcon class="mr-1" />
                新增素材
              </button>
            )}
          />
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
