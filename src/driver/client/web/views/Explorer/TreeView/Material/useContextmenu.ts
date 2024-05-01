import { container } from 'tsyringe';
import { compact } from 'lodash-es';
import assert from 'assert';

import { isEntityMaterial } from '@domain/shared/model/material';
import MaterialExplorer from '@domain/client/app/model/material/Explorer';
import { TileSplitDirections, Workbench } from '@domain/client/app/model/workbench';

import MoveBehavior from '@domain/client/app/model/behavior/MoveBehavior';
import StarManager from '@domain/client/app/model/StarManager';

export default function useContextmenu() {
  const explorer = container.resolve(MaterialExplorer);
  const workbench = container.resolve(Workbench);
  const starManager = container.resolve(StarManager);
  const { startMoving } = container.resolve(MoveBehavior);
  const { tree } = explorer;

  return () => {
    const node = tree.getSelectedNode();
    const isMultiple = tree.selectedNodes.length > 1;

    const isDirectory = !node.entity || !isEntityMaterial(node.entity);
    const canOpenInNewTab = !isDirectory && !workbench.currentTile?.findByEntity(node.entityLocator);
    const canOpenTo = !isDirectory && workbench.currentTile;

    assert(node.entity);

    return compact([
      isMultiple && { label: `共${tree.selectedNodes.length}项`, disabled: true },
      isMultiple && ({ type: 'separator' } as const),
      canOpenInNewTab && {
        label: '新标签页打开',
        onSelect: () => workbench.openEntity(node.entityLocator, { forceNewTab: true }),
      },
      canOpenTo && {
        label: '打开至...',
        submenu: [
          {
            label: '左边',
            onSelect: () =>
              workbench.openEntity(node.entityLocator, { dest: { splitDirection: TileSplitDirections.Left } }),
          },
          {
            label: '右边',
            onSelect: () =>
              workbench.openEntity(node.entityLocator, { dest: { splitDirection: TileSplitDirections.Right } }),
          },
          {
            label: '上边',
            onSelect: () =>
              workbench.openEntity(node.entityLocator, { dest: { splitDirection: TileSplitDirections.Top } }),
          },
          {
            label: '下边',
            onSelect: () =>
              workbench.openEntity(node.entityLocator, { dest: { splitDirection: TileSplitDirections.Bottom } }),
          },
        ],
      },
      { type: 'separator' } as const,
      !isMultiple && { label: '重命名', onSelect: () => explorer.rename.start(node.id) },
      !isMultiple && node.entity.isStar && { label: '取消收藏', onSelect: () => starManager.unstar(node.id) },
      !isMultiple && !node.entity.isStar && { label: '收藏', onSelect: () => starManager.star(node.id) },
      { label: '移动至...', onSelect: () => startMoving({ mode: 'select', from: tree, item: tree }) },
      { type: 'separator' } as const,
    ]);
  };
}
