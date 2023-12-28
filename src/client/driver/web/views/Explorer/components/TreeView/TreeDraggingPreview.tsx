import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useDragLayer } from 'react-dnd';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import Tree from '@web/components/Tree';
import ExplorerManager from '@domain/app/model/manager/ExplorerManager';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import { APP_CLASS_NAME } from '@web/infra/ui/constants';
import NodeTitle from './NodeTitle';

export default observer(function TreeView() {
  const { currentExplorer } = container.resolve(ExplorerManager);
  const { currentOffset, item } = useDragLayer((monitor) => ({
    currentOffset: monitor.getSourceClientOffset(),
    item: monitor.getItem(),
  }));

  return (
    item instanceof TreeNode &&
    (createPortal(
      <div className={APP_CLASS_NAME}>
        <Tree
          className="pointer-events-none fixed max-w-[300px] opacity-60"
          nodeClassName="py-1"
          style={{ left: currentOffset?.x, top: currentOffset?.y }}
          tree={currentExplorer.selectedNodesAsTree}
          renderTitle={(node) => <NodeTitle node={node}></NodeTitle>}
        />
      </div>,
      document.body,
    ) as ReactNode)
  );
});
