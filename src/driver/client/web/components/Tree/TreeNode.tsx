import { observer } from 'mobx-react-lite';
import { type MouseEventHandler, useEffect, useState } from 'react';
import { TriangleIcon, LoaderIcon } from 'lucide-react';
import clsx from 'clsx';

import type { HierarchyEntity } from '#domain/client/shared/model/entity';
import scrollIntoViewIfNeeded from './scrollIntoViewIfNeeded';
import type { TreeNodeProps } from './types';

// we should use an anonymous component to make <TreeNode> reactive
const TreeNode = observer(function <T extends HierarchyEntity>({ node, level, ...ctx }: TreeNodeProps<T>) {
  const {
    nodeClassName,
    titleClassName,
    iconClassName,
    onContextmenu,
    onClick,
    renderTitle,
    renderNode,
    tree,
    indent,
  } = ctx;
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);

  const expand: MouseEventHandler = (e) => {
    e.stopPropagation();

    if (node.isRoot) {
      return;
    }

    node.toggleExpand();
  };

  const handleClick: MouseEventHandler = (e) => {
    if (node.isDisabled) {
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      node.toggleSelect();
    } else {
      tree.setSelected([node.id]);
      onClick?.(node);
    }
  };

  const handleContextmenu: MouseEventHandler = (e) => {
    if (node.isDisabled) {
      return;
    }

    onContextmenu?.(node, e);
  };

  const treeNodeView = (
    <div
      style={{ paddingLeft: `${level * (indent ?? 25)}px` }}
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
        {renderTitle?.(node) ?? (
          <span className={typeof titleClassName === 'function' ? titleClassName(node) : titleClassName}>
            {node.view.title}
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
        node.children.map((child) => <TreeNode key={child.id} node={child} level={level + 1} {...ctx} />)}
    </>
  );
});

export default TreeNode;
