import { observer } from 'mobx-react-lite';
import { type MouseEventHandler, useEffect, useState } from 'react';
import { TriangleIcon, LoaderIcon } from 'lucide-react';
import clsx from 'clsx';

import type { HierarchyEntity } from '@shared/domain/model/entity';
import scrollIntoViewIfNeeded from './scrollIntoViewIfNeeded';
import type { TreeNodeProps } from './types';

const INDENT = 25;

// we should use an anonymous component to make <TreeNode> reactive
const TreeNode = observer(function <T extends HierarchyEntity>({ node, level, ...ctx }: TreeNodeProps<T>) {
  const {
    tree,
    nodeClassName,
    titleClassName,
    iconClassName,
    multiple,
    onContextmenu,
    onClick,
    renderTitle,
    renderNode,
  } = ctx;

  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);

  const expand: MouseEventHandler = (e) => {
    e.stopPropagation();

    if (node.id === tree.root.id) {
      return;
    }

    node.toggleExpand();
  };

  const handleClick: MouseEventHandler = (e) => {
    e.stopPropagation();

    const isMultiple = Boolean(multiple) && (e.metaKey || e.ctrlKey);

    onClick?.(node, isMultiple);
  };

  const handleContextmenu: MouseEventHandler = (e) => {
    e.stopPropagation();

    if (node.isDisabled || !onContextmenu) {
      return;
    }

    onContextmenu(node);
  };

  const treeNodeView = (
    <div
      style={{ paddingLeft: `${level * INDENT}px` }}
      ref={setRootEl}
      onClick={handleClick}
      onContextMenu={handleContextmenu}
      className={typeof nodeClassName === 'function' ? nodeClassName(node) : nodeClassName}
    >
      <div className="flex items-center">
        {node.isLoading ? (
          <LoaderIcon
            className={clsx(
              typeof iconClassName === 'function' ? iconClassName(node) : iconClassName,
              node.isLeaf && 'invisible',
              'shrink-0',
            )}
          />
        ) : (
          <TriangleIcon
            className={clsx(
              typeof iconClassName === 'function' ? iconClassName(node) : iconClassName,
              'fill-current shrink-0',
              node.isLeaf && 'invisible',
              node.isExpanded ? 'rotate-180' : 'rotate-90',
            )}
            onClick={expand}
          />
        )}
        {renderTitle ? (
          renderTitle(node)
        ) : (
          <span className={typeof titleClassName === 'function' ? titleClassName(node) : titleClassName}>
            {node.title}
          </span>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (node.isSelected && rootEl) {
      scrollIntoViewIfNeeded(rootEl, false);
    }
  }, [node.isSelected, rootEl]);

  return (
    <>
      {renderNode ? renderNode(node, treeNodeView) : treeNodeView}
      {node.isExpanded &&
        node.sortedChildren.map((child) => <TreeNode key={child.id} node={child} level={level + 1} {...ctx} />)}
    </>
  );
});

export default TreeNode;
