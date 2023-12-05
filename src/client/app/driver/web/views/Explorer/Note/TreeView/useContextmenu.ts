import { container } from 'tsyringe';
import { useContext } from 'react';

import { type ContextmenuItem, token as uiToken } from '@domain/infra/ui';
import Explorer from '@domain/model/Explorer';
import ctx from '../context';
import NoteService from '@domain/service/NoteService';

export default function useContextmenu() {
  const { noteTree } = container.resolve(Explorer);
  const ui = container.resolve(uiToken);
  const { movingModal } = useContext(ctx);

  const isMultiple = noteTree.selectedNodeIds.length > 0;
  const description = noteTree.selectedNodeIds.length + '项';
  const items: ContextmenuItem[] = isMultiple
    ? [
        { label: `移动${description}至...`, key: 'move' },
        { label: `批量编辑${description}属性`, key: 'edit' },
        { type: 'separator' },
        { label: `删除${description}`, key: 'delete' },
      ]
    : [
        { label: '移动至...', key: 'move' },
        { label: '制作副本', key: 'duplicate' },
        { type: 'separator' },
        { label: '删除', key: 'delete' },
      ];

  return async () => {
    const key = await ui.getActionFromContextmenu(items);
    const { duplicateNote } = container.resolve(NoteService);

    switch (key) {
      case 'move':
        return movingModal.open();
      case 'duplicate':
        return duplicateNote();
      default:
        break;
    }
  };
}
