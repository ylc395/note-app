import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
import { type MouseEvent, forwardRef } from 'react';
import { observer } from 'mobx-react-lite';

import type { TreeNode as TreeNodeModel, EntityWithParent } from 'model/Tree';
import type TreeModel from 'model/Tree';

const TreeNode = observer(function ({
  node,
  level,
  tree,
  className,
  titleClassName,
}: {
  node: TreeNodeModel;
  level: number;
  tree: TreeModel<EntityWithParent>;
  className?: string;
  titleClassName?: string;
}) {
  const expand = (e: MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    tree.toggleExpand(node.id);
  };

  const select = (e: MouseEvent) => {
    e.stopPropagation();
    tree.toggleSelect(node.id);
  };

  return (
    <>
      <div style={{ paddingLeft: `${level * 30}px` }}>
        <div className={className} data-selected={node.isSelected} onClick={select}>
          {!node.isLeaf &&
            (node.isExpanded ? <CaretDownOutlined onClick={expand} /> : <CaretRightFilled onClick={expand} />)}
          <span data-selected={node.isSelected} className={titleClassName}>
            {node.title}
          </span>
        </div>
      </div>
      {node.isExpanded &&
        !node.isLeaf &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            tree={tree}
            className={className}
            titleClassName={titleClassName}
          />
        ))}
    </>
  );
});

export default observer(
  forwardRef<
    HTMLDivElement,
    {
      tree: TreeModel<EntityWithParent>;
      nodeClassName?: string;
      className?: string;
      titleClassName?: string;
    }
  >(function Tree({ tree, nodeClassName, titleClassName, className }, treeRef) {
    return (
      <div className={className} ref={treeRef}>
        {tree.roots.map((node) => (
          <TreeNode
            tree={tree}
            key={node.id}
            node={node}
            level={0}
            className={nodeClassName}
            titleClassName={titleClassName}
          />
        ))}
      </div>
    );
  }),
);
