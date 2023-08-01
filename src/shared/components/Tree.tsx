import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
import { type MouseEvent, useCallback } from 'react';
import { observer } from 'mobx-react-lite';

import type { TreeNode as TreeNodeModel, EntityWithParent } from 'model/Tree';
import type TreeModel from 'model/Tree';

const TreeNode = observer(function ({
  node,
  level,
  tree,
}: {
  node: TreeNodeModel;
  level: number;
  tree: TreeModel<EntityWithParent>;
}) {
  const expand = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      tree.toggleExpand(node.id);
    },
    [node.id, tree],
  );

  const select = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      tree.toggleSelect(node.id);
    },
    [node.id, tree],
  );

  return (
    <>
      <div onClick={select} style={{ paddingLeft: `${level * 30}px` }}>
        <div className="flex items-center">
          {!node.isLeaf &&
            (node.isExpanded ? <CaretDownOutlined onClick={expand} /> : <CaretRightFilled onClick={expand} />)}
          <span>{node.title}</span>
        </div>
      </div>
      {node.isExpanded &&
        !node.isLeaf &&
        node.children.map((child) => <TreeNode key={child.id} node={child} level={level + 1} tree={tree} />)}
    </>
  );
});

export default observer(function Tree({ tree }: { tree: TreeModel<EntityWithParent> }) {
  return (
    <div>
      {tree.roots.map((node) => (
        <TreeNode tree={tree} key={node.id} node={node} level={0} />
      ))}
    </div>
  );
});
