import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
import { type MouseEvent, type ReactNode, type Ref, useContext, createContext } from 'react';
import { observer } from 'mobx-react-lite';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import memoize from 'lodash/memoize';
import { useCreation } from 'ahooks';

import type { TreeNode as TreeNodeModel, TreeNodeEntity, TreeNode } from '../model/abstract/Tree';
import type TreeModel from '../model/abstract/Tree';

const INDENT = 30;

interface TreeContext<T> {
  tree: TreeModel<TreeNodeEntity, T>;
  nodeClassName?: string;
  titleClassName?: string;
  draggingOverNodeClassName?: string;
  draggingOverTitleClassName?: string;
  emptyChildrenView?: (param: { indent: number }) => ReactNode;
  loadingIcon?: ReactNode;
  draggable?: boolean;
  droppable?: boolean;
  multiple?: boolean;
  renderTitle?: (node: TreeNode<T>) => ReactNode;
}

export const createTreeContext = memoize(function <T>() {
  const context = createContext<TreeNodeModel<T>>({} as never);

  return {
    Provider: context.Provider,
    context,
  };
});

const TreeNode = observer(function <T>({
  node,
  level,
  ctx,
}: {
  node: TreeNodeModel<T>;
  level: number;
  ctx: ReturnType<typeof createContext<TreeContext<T>>>;
}) {
  const {
    tree,
    nodeClassName,
    titleClassName,
    emptyChildrenView,
    loadingIcon,
    draggable,
    droppable,
    multiple,
    renderTitle,
  } = useContext(ctx);

  const id = useCreation(() => uniqueId(`tree-node-${node.id}`), [node.id]);

  const {
    setNodeRef: setDraggableRef,
    listeners,
    attributes,
  } = useDraggable({ id, disabled: !draggable, data: { instance: node } });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id, data: { instance: node }, disabled: !droppable });

  const isLoading = node.isExpanded && !node.children;
  const useLoadingIcon = isLoading && loadingIcon;

  const expand = (e: MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (isLoading) {
      return;
    }

    tree.toggleExpand(node === tree.root ? null : node.id);
  };

  const select = (e: MouseEvent) => {
    e.stopPropagation();
    tree.toggleSelect(node === tree.root ? null : node.id, { multiple: multiple && (e.metaKey || e.ctrlKey) });
  };

  return (
    <>
      <div style={{ paddingLeft: `${level * INDENT}px` }} ref={setDroppableRef}>
        <div
          className={nodeClassName}
          data-dragging={node.isUndroppable ? 'not-allowed' : isOver ? 'over' : undefined}
          data-selected={node.isSelected}
          ref={setDraggableRef}
          onClick={select}
          {...listeners}
          {...attributes}
        >
          {!node.isLeaf &&
            (useLoadingIcon ? (
              loadingIcon
            ) : node.isExpanded ? (
              <CaretDownOutlined onClick={expand} />
            ) : (
              <CaretRightFilled onClick={expand} />
            ))}
          <span
            data-dragging={node.isUndroppable ? 'not-allowed' : isOver ? 'over' : undefined}
            data-selected={node.isSelected}
            className={titleClassName}
          >
            {renderTitle ? renderTitle(node) : node.title}
          </span>
        </div>
      </div>
      {node.isExpanded &&
        node.children &&
        (node.children.length > 0
          ? node.children.map((child) => <TreeNode ctx={ctx} key={child.id} node={child} level={level + 1} />)
          : emptyChildrenView?.({ indent: (level + 1) * INDENT }))}
    </>
  );
});

export default observer(
  function Tree<T = unknown>(
    { className, visibleRoot, ...ctx }: { className?: string; visibleRoot?: boolean } & TreeContext<T>,
    treeRef: Ref<HTMLDivElement>,
  ) {
    const Context = useCreation(() => createContext<TreeContext<T>>({} as never), []);

    return (
      <Context.Provider value={ctx}>
        <div className={className} ref={treeRef}>
          {visibleRoot ? (
            <TreeNode<T> node={ctx.tree.root} level={0} ctx={Context} />
          ) : (
            ctx.tree.root.children?.map((node) => <TreeNode<T> ctx={Context} key={node.id} node={node} level={0} />)
          )}
        </div>
      </Context.Provider>
    );
  },
  { forwardRef: true },
);
