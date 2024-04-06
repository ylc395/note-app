import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { createPortal } from 'react-dom';
import assert from 'assert';

import Explorer from '@domain/app/model/abstract/Explorer';
import { APP_NAME } from '@shared/domain/infra/constants';
import ExplorerManager from '@domain/app/model/ExplorerManager';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import { useDragItem } from '@web/components/dnd/hooks';

import Tree from '@web/components/Tree';
import NodeTitle from './NodeTitle';

export default observer(function TreeView() {
  const { currentExplorer } = container.resolve(ExplorerManager);
  const { position, item } = useDragItem();

  assert(currentExplorer instanceof Explorer);

  return (
    item instanceof TreeNode &&
    createPortal(
      <div className={APP_NAME}>
        <Tree
          className="rounded-md bg-common-secondary-highlight pointer-events-none fixed max-w-[300px] opacity-60 text-sm"
          iconClassName="ml-1 w-3 h-3 opacity-80"
          nodeClassName="py-1 opacity-60"
          style={{ left: position?.x, top: position?.y }}
          tree={currentExplorer.dnd.selectedNodesAsTree}
          renderTitle={(node) => <NodeTitle node={node}></NodeTitle>}
        />
      </div>,
      document.body,
    )
  );
});
