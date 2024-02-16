import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import assert from 'assert';

import Explorer from '@domain/app/model/abstract/Explorer';
import ExplorerManager from '@domain/app/model/ExplorerManager';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import { useDragItem } from '@web/components/dnd/hooks';

import Tree from '@web/components/Tree';
import { APP_CLASS_NAME } from '@web/infra/ui/constants';
import NodeTitle from './NodeTitle';

export default observer(function TreeView() {
  const { currentExplorer } = container.resolve(ExplorerManager);
  const { position, item } = useDragItem();

  assert(currentExplorer instanceof Explorer);

  return (
    item instanceof TreeNode &&
    (createPortal(
      <div className={APP_CLASS_NAME}>
        <Tree
          className="pointer-events-none fixed max-w-[300px] opacity-60"
          nodeClassName="py-1"
          style={{ left: position?.x, top: position?.y }}
          tree={currentExplorer.dnd.selectedNodesAsTree}
          renderTitle={(node) => <NodeTitle node={node}></NodeTitle>}
        />
      </div>,
      document.body,
    ) as ReactNode)
  );
});
