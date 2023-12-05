import { useCallback, useContext } from 'react';
import { container } from 'tsyringe';

import { EntityTypes } from '@domain/model/entity';
import Workbench, { TileSplitDirections } from '@domain/model/workbench/Workbench';
import type { NoteTreeNode } from '@domain/model/note/Tree';

import NoteService from '@domain/service/NoteService';
import StarService from '@domain/service/StarService';

import type { ContextmenuItem } from '@domain/infra/ui';
import { ui } from '@web-infra/ui';

import Context from '../context';
import assert from 'assert';
import Explorer from '@domain/model/Explorer';

export default function useContextmenu() {
  const { movingModal, editingModal } = useContext(Context);

  return useCallback(
    async (targetNode: NoteTreeNode) => {
      const workbench = container.resolve(Workbench);
      const { noteTree } = container.resolve(Explorer);
      const noteService = container.resolve(NoteService);
      const starService = container.resolve(StarService);

      const { selectedNodeIds } = noteTree;

      if (!selectedNodeIds.includes(targetNode.id)) {
        noteTree.toggleSelect(targetNode.id, { multiple: true, reason: 'drag' });
      }

      const targetId = targetNode.id;
      const isMultiple = selectedNodeIds.length > 1;
      const description = selectedNodeIds.length + '项';

      const items: ContextmenuItem[] = isMultiple
        ? [
            { label: `移动${description}至...`, key: 'move' },
            { label: `收藏${description}`, key: 'star' },
            { type: 'separator' },
            { label: `批量编辑${description}属性`, key: 'edit' },
            { type: 'separator' },
            { label: `导出${description}`, key: 'export' },
            { type: 'separator' },
            { label: `删除${description}`, key: 'delete' },
          ]
        : [
            { label: '在新窗口打开', key: 'openInNewWindow', visible: Boolean(workbench.focusedTile) },
            { type: 'separator' },
            { label: '移动至...', key: 'move' },
            // { label: targetNode.entity.isStar ? '已收藏' : '收藏', key: 'star', disabled: targetNode.entity.isStar },
            { label: '制作副本', key: 'duplicate' },
            { label: '编辑属性', key: 'edit' },
            { type: 'separator' },
            { label: '使用外部应用打开', key: 'external' },
            { label: '导出', key: 'export' },
            { type: 'separator' },
            { label: '删除', key: 'delete' },
          ];

      const action = await ui.getActionFromContextmenu(items);

      if (!action) {
        return;
      }

      switch (action) {
        case 'duplicate':
          return noteService.duplicateNote(targetId);
        case 'delete':
          return;
        // return noteService.deleteNotes(selectedNodeIds);
        case 'move':
          return movingModal.open();
        case 'edit':
          return editingModal.open();
        case 'star':
          return;
        // return starService.star(EntityTypes.Note, selectedNodeIds);
        case 'openInNewWindow':
          assert(workbench.focusedTile);

          return workbench.openEntity(
            { entityType: EntityTypes.Note, entityId: targetId },
            { from: workbench.focusedTile, splitDirection: TileSplitDirections.Right },
          );
        default:
          break;
      }
    },
    [editingModal, movingModal],
  );
}
