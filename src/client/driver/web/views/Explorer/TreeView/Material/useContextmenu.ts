import { container } from 'tsyringe';
import { compact } from 'lodash-es';
import assert from 'assert';

import { isEntityMaterial } from '@shared/domain/model/material';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import { Workbench } from '@domain/app/model/workbench';

import useBaseContextmenu from '../common/Tree/useContextmenu';
import MaterialService from '@domain/app/service/MaterialService';

export default function useContextmenu() {
  const explorer = container.resolve(MaterialExplorer);
  const workbench = container.resolve(Workbench);
  const { move } = container.resolve(MaterialService);
  const { tree } = explorer;

  return {
    ...useBaseContextmenu(explorer, (action) => {
      switch (action) {
        case 'move':
          return move.selectTarget();
        default:
          break;
      }
    }),
    getContextmenuItems: () => {
      const node = tree.getSelectedNode();
      const isMultiple = tree.selectedNodes.length > 1;

      const isDirectory = !node.entity || !isEntityMaterial(node.entity);
      const canOpenInNewTab = !isDirectory && !workbench.currentTile?.findByEntity(node.entityLocator);
      const canOpenTo = !isDirectory && workbench.currentTile;

      assert(node.entity);

      return compact([
        isMultiple && { label: `共${tree.selectedNodes.length}项`, disabled: true },
        isMultiple && ({ type: 'separator' } as const),
        canOpenInNewTab && { label: '新标签页打开', key: 'openInNewTab' },
        canOpenTo && {
          label: '打开至...',
          submenu: [
            { label: '左边', key: 'openToLeft' },
            { label: '右边', key: 'openToRight' },
            { label: '上边', key: 'openToTop' },
            { label: '下边', key: 'openToBottom' },
          ],
        },
        { type: 'separator' } as const,
        !isMultiple && { label: '重命名', key: 'rename' },
        !isMultiple && node.entity.isStar && { label: '取消收藏', key: 'unstar' },
        !isMultiple && !node.entity.isStar && { label: '收藏', key: 'star' },
        { label: '移动至...', key: 'move' },
        { type: 'separator' } as const,
        { label: '删除', key: 'delete' },
      ]);
    },
  };
}
