import assert from 'assert';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import StarService from '#domain/client/app/service/StarService';
import RecyclableService from '#domain/client/app/service/RecyclableService';

import { EntityTypes } from '#domain/shared/model/entity';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';

export default function useContextmenu() {
  const { exploreTreeView: tree, createNote } = container.resolve(NoteService);
  const { star, unstar } = container.resolve(StarService);
  const { put } = container.resolve(RecyclableService);

  function handleContextMenuClick(key: string) {
    const {
      treeNodeSets: { selected },
      selectedNode,
    } = tree;
    assert(selectedNode?.value);

    switch (key) {
      case 'star':
        return selectedNode.value.isStar ? unstar(selectedNode.id) : star(selectedNode.id);
      case 'duplicate':
        return createNote({ from: selectedNode.value.id });
      case 'delete':
        return put(Array.from(selected), EntityTypes.Note);
      default:
        break;
    }
  }

  function contextmenu(node: TreeNode) {
    return [
      { label: '移动至...', key: 'move' },
      { label: '更改图标', key: 'icon' },
      ...(tree.treeNodeSets.selected.size === 1
        ? [
            { label: node.value?.isStar ? '取消收藏' : '收藏', key: 'star' },
            'separator' as const,
            { label: '复制', key: 'duplicate' },
          ]
        : []),
      'separator' as const,
      { label: '删除', key: 'delete', className: 'text-feedback-danger' },
    ];
  }

  return {
    contextmenu,
    handleContextMenuClick,
  };
}
