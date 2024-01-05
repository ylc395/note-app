import { useState } from 'react';
import { container } from 'tsyringe';
import { useMemoizedFn } from 'ahooks';

import { type Tile, Workbench } from '@domain/app/model/workbench';
import Editor from '@domain/app/model/abstract/Editor';
import TreeNode from '@domain/common/model/abstract/TreeNode';

export default function useDrop(target: Tile | Editor) {
  const { moveEditor, openEntity } = container.resolve(Workbench);

  const [isOver, setIsOver] = useState(false);
  const onDrop = useMemoizedFn((item: unknown) => {
    if (item instanceof Editor) {
      moveEditor(item, target);
    }

    if (item instanceof TreeNode) {
      for (const node of item.tree.selectedNodes) {
        openEntity(node.entityLocator, { dest: target, forceNewTab: true });
      }
    }
  });

  return { isOver, setIsOver, onDrop, moveEditor };
}
