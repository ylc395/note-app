import { container } from 'tsyringe';
import { useContext } from 'react';
import { compact } from 'lodash-es';

import { type MenuItem, token as uiToken } from '@domain/infra/ui';
import Explorer from '@domain/model/Explorer';
import NoteService from '@domain/service/NoteService';
import ctx from '../context';

export default function useContextmenu() {
  const { movingModal } = useContext(ctx);

  return async () => {
    const { duplicateNote } = container.resolve(NoteService);
    const { noteTree } = container.resolve(Explorer);
    const ui = container.resolve(uiToken);

    const isMultiple = noteTree.selectedNodeIds.length > 1;
    const items: MenuItem[] = compact([
      isMultiple && { label: `共${noteTree.selectedNodeIds.length}项`, disabled: true },
      isMultiple && { type: 'separator' },
      { label: '移动至...', key: 'move' },
      !isMultiple && { label: '制作副本', key: 'duplicate' },
      { type: 'separator' },
      { label: '删除', key: 'delete' },
    ]);

    const key = await ui.getActionFromMenu(items);

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
