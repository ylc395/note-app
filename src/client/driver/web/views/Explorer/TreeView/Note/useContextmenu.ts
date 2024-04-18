import { container } from 'tsyringe';
import assert from 'assert';
import { compact } from 'lodash-es';

import NoteExplorer from '@domain/app/model/note/Explorer';
import { Workbench } from '@domain/app/model/workbench';
import useBaseContextmenu from '../common/Tree/useContextmenu';
import NoteService from '@domain/app/service/NoteService';

export default function useContextmenu() {
  const explorer = container.resolve(NoteExplorer);
  const workbench = container.resolve(Workbench);
  const { createNote, move } = container.resolve(NoteService);
  const { tree } = explorer;

  return {
    ...useBaseContextmenu(explorer, (action) => {
      const noteId = tree.getSelectedNode().id;

      switch (action) {
        case 'duplicate':
          return createNote({ from: noteId });
        case 'move':
          return move.selectTarget();
        default:
          assert.fail(`invalid action: ${action}`);
      }
    }),
    getContextmenuItems: () => {
      const isMultiple = tree.selectedNodes.length > 1;
      const node = tree.getSelectedNode();
      const canOpenInNewTab = !workbench.currentTile?.findByEntity(node.entityLocator);

      assert(node.entity);

      return compact([
        isMultiple && { label: `共${tree.selectedNodes.length}项`, disabled: true },
        isMultiple && ({ type: 'separator' } as const),
        canOpenInNewTab && { label: '新标签页打开', key: 'openInNewTab' },
        workbench.currentTile && {
          label: '打开至...',
          submenu: [
            { label: '左边', key: 'openToLeft' },
            { label: '右边', key: 'openToRight' },
            { label: '上边', key: 'openToTop' },
            { label: '下边', key: 'openToBottom' },
          ],
        },
        { type: 'separator' } as const,
        { label: '移动至...', key: 'move' },
        !isMultiple && { label: '重命名', key: 'rename' },
        !isMultiple && { label: '制作副本', key: 'duplicate' },
        !isMultiple && node.entity.isStar && { label: '取消收藏', key: 'unstar' },
        !isMultiple && !node.entity.isStar && { label: '收藏', key: 'star' },
        { type: 'separator' } as const,
        { label: '删除', key: 'delete' },
      ]);
    },
  };
}
