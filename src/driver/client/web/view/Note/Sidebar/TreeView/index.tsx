import { ShrinkIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import assert from 'assert';
import NoteService from '#domain/client/app/service/NoteService';
import StarService from '#domain/client/app/service/StarService';
import RecyclableService from '#domain/client/app/service/RecyclableService';

import { EntityTypes } from '#domain/shared/model/entity';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import BaseTreeView from '#web/components/NoteTree';
import { IconDisplayMode } from '#domain/client/app/model/note/TreeView';

import AddButton from './AddButton';
import SettingButton from './SettingButton';

export default function TreeView() {
  const { workbench, exploreTreeView: tree, createNote } = container.resolve(NoteService);
  const { star, unstar } = container.resolve(StarService);
  const { put } = container.resolve(RecyclableService);

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
    const { selectedNode, selectedNodeIds } = tree.tree;
    assert(selectedNode.value);

    switch (key) {
      case 'star':
        return selectedNode.value.isStar ? unstar(selectedNode.id) : star(selectedNode.id);
      case 'duplicate':
        return createNote({ from: selectedNode.value.id });
      case 'delete':
        return put(Array.from(selectedNodeIds), EntityTypes.Note);
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
              ? [
                  { label: node.value?.isStar ? '取消收藏' : '收藏', key: 'star' },
                  'separator' as const,
                  { label: '复制', key: 'duplicate' },
                ]
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
