import { ShrinkIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import NoteService from '#domain/client/app/service/NoteService';
import StarService from '#domain/client/app/service/StarService';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import BaseTreeView from '#web/components/NoteTree';
import { IconDisplayMode } from '#domain/client/app/model/note/TreeView';

import AddButton from './AddButton';
import SettingButton from './SettingButton';

export default function TreeView() {
  const { workbench, exploreTreeView: tree } = container.resolve(NoteService);
  const { star, unstar } = container.resolve(StarService);

  function handleItemClick(node: TreeNode) {
    if (!node.value) {
      return;
    }

    workbench.open(node.value);
  }

  function shouldRenderIcon(node: TreeNode) {
    const iconMode = tree.settings.get('iconDisplayMode');

    if (iconMode === IconDisplayMode.Custom) {
      return Boolean(node.value?.icon);
    }

    return iconMode === IconDisplayMode.All;
  }

  function handleContextMenuClick(key: string) {
    const { selectedNode } = tree.tree;
    switch (key) {
      case 'star':
        return selectedNode.value?.isStar ? unstar(selectedNode.id) : star(selectedNode.id);
      default:
        break;
    }
  }

  return (
    <div class="grow min-h-0 flex flex-col">
      <div class="mb-stack-s flex justify-between items-center">
        <AddButton buttonClassName="button button-primary button-md" menuPlacement="bottom-start" />
        <div class="flex">
          <button disabled={!tree.canCollapse} onClick={tree.collapseAll} class="button button-square-md">
            <ShrinkIcon />
          </button>
          <SettingButton />
        </div>
      </div>
      <Show when={tree.settings.isReady}>
        <BaseTreeView
          className="min-h-0 grow overflow-auto scrollbar-stable text-sm text-text-secondary"
          onItemTitleClick={handleItemClick}
          treeView={tree}
          shouldRenderIcon={shouldRenderIcon}
          onContextMenuClick={handleContextMenuClick}
          contextMenu={(node) => [
            { label: '移动至...', key: 'move' },
            { label: '更改图标', key: 'icon' },
            ...(tree.tree.selectedNodeIds.size === 1
              ? (['separator', { label: node.value?.isStar ? '取消收藏' : '收藏', key: 'star' }] as const)
              : []),
            'separator',
            { label: '删除', key: 'delete', className: 'text-feedback-danger' },
          ]}
          renderOperation={(node) => (
            <AddButton
              buttonClassName='button button-primary button-square-tiny text-brand-secondary h-full ml-inset-squish group-hover:flex data-[state="open"]:flex hidden'
              iconOnly
              node={node}
              menuPlacement="bottom-end"
            />
          )}
        />
      </Show>
    </div>
  );
}
