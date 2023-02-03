import { container } from 'tsyringe';
import { useCallback } from 'react';

import type { NoteVO as Note } from 'interface/Note';
import type { MenuItem } from 'infra/Contextmenu';
import ViewService from 'service/ViewService';
import NoteService from 'service/NoteService';

export default function useContextmenu() {
  const { contextmenu } = container.resolve(ViewService);
  const {
    noteTree: { selectedNodes },
  } = container.resolve(NoteService);

  return useCallback(
    async (note: Note) => {
      const isMultiple = selectedNodes.size > 1 && selectedNodes.has(note.id);
      const noteIds = isMultiple ? Array.from(selectedNodes) : [note.id];
      const description = noteIds.length + '项';
      const items: MenuItem[] = isMultiple
        ? [
            { label: `移动${description}至...`, key: 'move' },
            { label: `收藏${description}`, key: 'star' },
            { type: 'separator' },
            { label: `导出${description}`, key: 'export' },
            { type: 'separator' },
            { label: `删除${description}`, key: 'delete' },
          ]
        : [
            { label: '在新标签页打开', key: 'delete' },
            { label: '在新窗口打开', key: 'delete' },
            { type: 'separator' },
            { label: '重命名', key: 'rename' },
            { label: '移动至...', key: 'move' },
            { label: '收藏', key: 'export' },
            { label: '制作副本', key: 'duplicate' },
            { type: 'separator' },
            { label: '使用外部应用打开', key: 'external' },
            { label: '导出', key: 'export' },
            { type: 'separator' },
            { label: '删除', key: 'delete' },
          ];

      const key = await contextmenu.popup(items);

      if (!key) {
        return;
      }

      switch (key) {
        case 'rename':
          break;

        default:
          break;
      }
    },
    [contextmenu, selectedNodes],
  );
}
