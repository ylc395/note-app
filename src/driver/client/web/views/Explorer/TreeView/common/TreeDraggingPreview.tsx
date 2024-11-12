import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { createPortal } from 'react-dom';

import Explorer from '#domain/client/app/model/abstract/Explorer';
import { APP_NAME } from '#domain/shared/infra/constants';
import ExplorerManager from '#domain/client/app/model/ExplorerManager';
import TreeNode from '#domain/client/common/model/abstract/TreeNode';
import { useDragItem } from '#web/components/dnd/hooks';

import Tree from '#web/components/Tree';
import NodeTitle from './ExplorerTree/NodeTitle';
import { useMemo } from 'react';
import MoveBehavior from '#domain/client/app/model/behavior/MoveBehavior';

export default observer(function TreeDraggingPreview() {
  const { currentExplorer } = container.resolve(ExplorerManager);
  const { position, item } = useDragItem();
  const { isDraggingMoving } = container.resolve(MoveBehavior);

  const tree = useMemo(
    () =>
      currentExplorer instanceof Explorer &&
      isDraggingMoving &&
      item instanceof TreeNode &&
      item.entityLocator.entityType === currentExplorer.entityType &&
      currentExplorer.getTreeFromSelectedNodes(),
    [currentExplorer, item, isDraggingMoving],
  );

  return (
    tree &&
    createPortal(
      <div className={APP_NAME}>
        <Tree
          className="rounded-md pointer-events-none fixed max-w-[300px] opacity-60 text-sm"
          iconClassName="invisible"
          nodeClassName="py-1 opacity-60"
          style={{ left: position?.x, top: position?.y }}
          tree={tree}
          renderTitle={(node) => <NodeTitle node={node}></NodeTitle>}
        />
      </div>,
      document.body,
    )
  );
});
