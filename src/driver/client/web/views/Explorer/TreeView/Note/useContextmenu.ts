import { container } from 'tsyringe';
import assert from 'assert';
import { compact } from 'lodash-es';

import NoteExplorer from '@domain/client/app/model/note/Explorer';
import { TileSplitDirections, Workbench } from '@domain/client/app/model/workbench';
import StarManager from '@domain/client/app/model/StarManager';
import MoveBehavior from '@domain/client/app/model/behavior/MoveBehavior';

export default function useContextmenu() {
  const explorer = container.resolve(NoteExplorer);
  const workbench = container.resolve(Workbench);
  const starManager = container.resolve(StarManager);
  const { startMoving } = container.resolve(MoveBehavior);
  const { tree } = explorer;

  return () => {
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
      { label: '移动至...', onSelect: () => startMoving({ mode: 'select', from: tree, item: tree }) },
      !isMultiple && { label: '重命名', onSelect: () => explorer.rename.start(node.id) },
      !isMultiple && { label: '制作副本', key: 'duplicate' },
      !isMultiple && node.entity.isStar && { label: '取消收藏', onSelect: () => starManager.unstar(node.id) },
      !isMultiple && !node.entity.isStar && { label: '收藏', onSelect: () => starManager.star(node.id) },
      { type: 'separator' } as const,
      { label: '删除', key: 'delete' },
    ]);
  };
}
