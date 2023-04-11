import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect } from 'react';
import MaterialService from 'service/MaterialService';
import Tree, { type TreeProps } from 'web/components/Tree';
import type { MaterialTreeNode } from 'model/material/Tree';

export default observer(function MaterialTreeView() {
  const { materialTree } = container.resolve(MaterialService);
  const handleExpand = useCallback<TreeProps<MaterialTreeNode>['onExpand']>(
    ({ key }) => materialTree.toggleExpand(key, false),
    [materialTree],
  );

  const titleRender = useCallback<NonNullable<TreeProps<MaterialTreeNode>['titleRender']>>((node) => node.title, []);

  useEffect(() => {
    materialTree.loadChildren();
  }, [materialTree]);

  return (
    <div className="h-full">
      <Tree
        multiple
        draggable
        tree={materialTree}
        onSelect={() => {}}
        onExpand={handleExpand}
        titleRender={titleRender}
      />
    </div>
  );
});
