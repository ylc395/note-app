import type { JSX } from 'solid-js';
import { Menu } from '@ark-ui/solid';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';

import BaseTreeView from '#web/components/NoteTree';
import AddButton from './AddButton';
import SettingButton from './SettingButton';
import { Portal } from 'solid-js/web';
import shell from '#web/infra/shell';

export default function TreeView() {
  const { workbench, exploreTreeView: tree } = container.resolve(NoteService);

  function handleItemClick(node: TreeNode) {
    if (!node.value) {
      return;
    }

    workbench.open(node.value);
  }

  function renderItem(original: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element) {
    return (
      <Menu.Root unmountOnExit lazyMount>
        <Menu.ContextTrigger asChild={(childProps) => original(childProps())} />
        <Portal mount={shell.appRoot}>
          <Menu.Positioner class="absolute">
            <Menu.Content class="menu text-text-secondary">
              <Menu.Item class="menu-item" value="delete">
                移动至...
              </Menu.Item>
              <Menu.Item class="menu-item" value="delete">
                更改图标
              </Menu.Item>
              <Menu.Item class="menu-item text-feedback-danger" value="delete">
                删除
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  }

  return (
    <div class="grow min-h-0 flex flex-col">
      <div class="mb-stack-s flex justify-between items-center">
        <AddButton buttonClassName="button button-primary button-md" menuPlacement="bottom-start" />
        <SettingButton />
      </div>
      <BaseTreeView
        className="min-h-0 grow overflow-auto scrollbar-stable text-sm scrollbar-thin text-text-secondary"
        onItemTitleClick={handleItemClick}
        treeView={tree}
        renderItem={renderItem}
        renderOperation={(node) => (
          <AddButton
            buttonClassName='button button-primary button-square-tiny text-brand-secondary h-full ml-inset-squish group-hover:flex data-[state="open"]:flex hidden'
            iconOnly
            node={node}
            menuPlacement="bottom-end"
          />
        )}
      />
    </div>
  );
}
