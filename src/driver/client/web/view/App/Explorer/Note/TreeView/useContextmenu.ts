import assert from 'assert';
import { compact } from 'lodash-es';
import { writeClipboard } from '@solid-primitives/clipboard';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import StarService from '#domain/client/app/service/StarService';
import RecyclableService from '#domain/client/app/service/RecyclableService';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import { EntityTypes } from '#domain/shared/model/entity';
import type { MenuItem } from '#web/view/components/Menu';
import { IconDisplayMode } from '#domain/client/app/model/note/TreeExplorer/Setting';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

import IconPicker from './IconPicker';

export default function useContextmenu() {
  const { explorer: tree, createNote } = container.resolve(NoteService);
  const { star, unstar } = container.resolve(StarService);
  const { put } = container.resolve(RecyclableService);

  function handleContextMenuClick(key: string) {
    const {
      treeNodeSets: { selected },
      selectedNode,
      iconPicker,
    } = tree;

    assert(selectedNode?.value);

    switch (key) {
      case 'star':
        return selectedNode.value.isStar ? unstar(selectedNode.id) : star(selectedNode.id);
      case 'duplicate':
        return createNote({ from: selectedNode.value.id });
      case 'delete':
        return put(Array.from(selected), EntityTypes.Note);
      case 'createIcon':
        return iconPicker.initCustomIconPicker();
      case 'copyUrl':
        return writeClipboard(getAppUrl(RouteTypes.Note, selectedNode.value.id));
      default:
        break;
    }
  }

  function contextmenu(node: TreeNode): Array<MenuItem | 'separator'> {
    const isSingle = tree.treeNodeSets.selected.size === 1;
    const shouldShowIcon = tree.settings.iconDisplayMode !== IconDisplayMode.None;

    return compact([
      { label: '移动至...', key: 'move' },
      shouldShowIcon && {
        label: '更改图标',
        key: 'icon',
        children: [
          {
            label: '选择图标',
            key: 'icon-choose',
            content: ({ closeMenu }) => IconPicker({ onFinish: closeMenu }),
          },
          { label: '新建图标', key: 'createIcon' },
        ],
      },
      ...(isSingle
        ? [
            { label: node.value?.isStar ? '取消收藏' : '收藏', key: 'star' },
            { label: '复制 URL', key: 'copyUrl' },
            'separator' as const,
            { label: '复制', key: 'duplicate' },
          ]
        : []),
      'separator' as const,
      { label: '删除', key: 'delete', className: 'text-fg-danger' },
    ]);
  }

  return {
    contextmenu,
    handleContextMenuClick,
  };
}
