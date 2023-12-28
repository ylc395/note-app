import { observer } from 'mobx-react-lite';
import { type MouseEventHandler, useEffect, useState } from 'react';
import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
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
    caretClassName,
    loadingIcon,
    multiple,
    onContextmenu,
    onClick,
    renderTitle,
    renderNode,
  } = ctx;

  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  const useLoadingIcon = node.isLoading && loadingIcon;

  const expand: MouseEventHandler = (e) => {
    e.stopPropagation();

    if (useLoadingIcon || node.id === tree.root.id) {
      return;
    }

    tree.toggleExpand(node.id);
  };

  const handleClick: MouseEventHandler = (e) => {
    e.stopPropagation();

    const isMultiple = Boolean(multiple) && (e.metaKey || e.ctrlKey);

    tree.toggleSelect(node.id, { isMultiple });
    onClick?.(node, isMultiple);
  };

  const handleContextmenu: MouseEventHandler = (e) => {
    e.stopPropagation();

    if (node.isDisabled || !onContextmenu) {
      return;
    }

    tree.toggleSelect(node.id, { value: true });
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
      <div className={clsx('flex', node.isLeaf && 'pl-4')}>
        {!node.isLeaf &&
          (useLoadingIcon ? (
            loadingIcon
          ) : node.isExpanded ? (
            <CaretDownOutlined
              className={typeof caretClassName === 'function' ? caretClassName(node) : caretClassName}
              onClick={expand}
            />
          ) : (
            <CaretRightFilled
              className={typeof caretClassName === 'function' ? caretClassName(node) : caretClassName}
              onClick={expand}
            />
          ))}
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
        node.children.map((child) => <TreeNode key={child.id} node={child} level={level + 1} {...ctx} />)}
    </>
  );
});

export default TreeNode;
