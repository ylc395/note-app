import { useCallback, useContext } from 'react';
import { container } from 'tsyringe';

import { EntityTypes } from 'interface/entity';
import type { NoteTreeNode } from 'model/note/Tree';
import { TileSplitDirections } from 'model/workbench/TileManger';

import NoteService from 'service/NoteService';
import EditorService from 'service/EditorService';
import StarService from 'service/StarService';

import type { ContextmenuItem } from 'infra/UI';
import { ui } from 'web/infra/ui';

import { ModalContext } from '../useModals';

export default function useContextmenu() {
  const modals = useContext(ModalContext);

  return useCallback(
    async (targetNode: NoteTreeNode) => {
      const {
        tileManager: { focusedTile },
        openEntity,
      } = container.resolve(EditorService);
      const noteService = container.resolve(NoteService);
      const starService = container.resolve(StarService);

      const { selectedNodes } = noteService.noteTree;

      if (!selectedNodes.has(targetNode)) {
        noteService.noteTree.toggleSelect(targetNode.key, true);
      }

      const targetId = targetNode.key;
      const isMultiple = selectedNodes.size > 1;
      const description = selectedNodes.size + '项';

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
            { label: '在新窗口打开', key: 'openInNewWindow', visible: Boolean(focusedTile) },
            { type: 'separator' },
            { label: '移动至...', key: 'move' },
            { label: targetNode.entity.isStar ? '已收藏' : '收藏', key: 'star', disabled: targetNode.entity.isStar },
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

      const targetIds = noteService.noteTree.getSelectedIds();

      switch (action) {
        case 'duplicate':
          return noteService.duplicateNote(targetId);
        case 'delete':
          return noteService.deleteNotes(targetIds);
        case 'move':
          return modals.moving.open();
        case 'edit':
          return modals.editing.open();
        case 'star':
          return starService.starNotes(targetIds);
        case 'openInNewWindow':
          if (!focusedTile) {
            throw new Error('no focusedTile');
          }

          return openEntity(
            { entityType: EntityTypes.Note, entityId: targetId },
            { from: focusedTile, direction: TileSplitDirections.Right },
          );
        default:
          break;
      }
    },
    [modals.editing, modals.moving],
  );
}
