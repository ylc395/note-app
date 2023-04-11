import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect } from 'react';

import MaterialService from 'service/MaterialService';
import Tree, { type TreeProps } from 'web/components/Tree';
import type { MaterialTreeNode } from 'model/material/Tree';

import NodeTitle from './NodeTitle';

export default observer(function MaterialTreeView() {
  const { materialTree, selectMaterial } = container.resolve(MaterialService);
  const handleExpand = useCallback<TreeProps<MaterialTreeNode>['onExpand']>(
    ({ key }) => materialTree.toggleExpand(key, false),
    [materialTree],
  );

  const titleRender = useCallback<NonNullable<TreeProps<MaterialTreeNode>['titleRender']>>(
    (node) => <NodeTitle node={node} />,
    [],
  );

  useEffect(() => {
    materialTree.loadChildren();
  }, [materialTree]);

  return (
    <div className="h-full">
      <Tree
        multiple
        draggable
        tree={materialTree}
        onSelect={selectMaterial}
        onExpand={handleExpand}
        titleRender={titleRender}
      />
    </div>
  );
});
