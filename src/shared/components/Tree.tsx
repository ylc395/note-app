import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
import { type MouseEvent, forwardRef, ReactNode } from 'react';
import { observer } from 'mobx-react-lite';

import type { TreeNode as TreeNodeModel, EntityWithParent } from 'model/Tree';
import type TreeModel from 'model/Tree';

const INDENT = 30;

const TreeNode = observer(function ({
  node,
  level,
  tree,
  className,
  titleClassName,
  emptyChildren,
}: {
  node: TreeNodeModel;
  level: number;
  tree: TreeModel<EntityWithParent>;
  className?: string;
  titleClassName?: string;
  emptyChildren?: (param: { indent: number }) => ReactNode;
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
      <div style={{ paddingLeft: `${level * INDENT}px` }}>
        <div className={className} data-selected={node.isSelected} onClick={select}>
          {!node.isLeaf &&
            (node.isExpanded ? <CaretDownOutlined onClick={expand} /> : <CaretRightFilled onClick={expand} />)}
          <span data-selected={node.isSelected} className={titleClassName}>
            {node.title}
          </span>
        </div>
      </div>
      {node.isExpanded &&
        (node.children.length > 0
          ? node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                tree={tree}
                className={className}
                titleClassName={titleClassName}
              />
            ))
          : emptyChildren?.({ indent: (level + 1) * INDENT }))}
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
      emptyChildren?: (param: { indent: number }) => ReactNode;
    }
  >(function Tree({ tree, nodeClassName, titleClassName, className, emptyChildren }, treeRef) {
    return (
      <div className={className} ref={treeRef}>
        {tree.roots.map((node) => (
          <TreeNode
            emptyChildren={emptyChildren}
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
