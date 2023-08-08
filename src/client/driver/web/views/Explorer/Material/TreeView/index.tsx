import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect } from 'react';

import type { MaterialNodeAttr } from 'model/material/Tree';
import MaterialService from 'service/MaterialService';
import Tree from 'components/Tree';

import NodeTitle from './NodeTitle';

export default function MaterialTreeView() {
  const { loadChildren, materialTree } = container.resolve(MaterialService);

  useEffect(() => {
    loadChildren(null);
  }, [loadChildren]);

  return (
    <div className="h-full">
      <Tree<MaterialNodeAttr>
        draggable
        droppable
        nodeClassName="tree-node"
        tree={materialTree}
        renderTitle={(node) => <NodeTitle node={node} />}
      />
    </div>
  );
}
