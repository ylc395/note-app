import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
import { type MouseEvent, forwardRef, ReactNode, useContext, createContext } from 'react';
import { observer } from 'mobx-react-lite';

import type { TreeNode as TreeNodeModel, EntityWithParent } from 'model/Tree';
import type TreeModel from 'model/Tree';

const INDENT = 30;

interface TreeContext {
  tree: TreeModel<EntityWithParent>;
  nodeClassName?: string;
  titleClassName?: string;
  emptyChildrenView?: (param: { indent: number }) => ReactNode;
  loadingIcon?: ReactNode;
}

const Context = createContext<TreeContext>({} as never);

const TreeNode = observer(function ({ node, level }: { node: TreeNodeModel; level: number }) {
  const { tree, nodeClassName: className, titleClassName, emptyChildrenView, loadingIcon } = useContext(Context);

  const isLoading = node.isExpanded && !node.children;
  const useLoadingIcon = isLoading && loadingIcon;

  const expand = (e: MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (isLoading) {
      return;
    }

    tree.toggleExpand(node.id);
  };

  const select = (e: MouseEvent) => {
    e.stopPropagation();

    if (!node.isSelected) {
      tree.toggleSelect(node.id);
    }
  };

  return (
    <>
      <div style={{ paddingLeft: `${level * INDENT}px` }}>
        <div className={className} data-selected={node.isSelected}>
          {!node.isLeaf &&
            (useLoadingIcon ? (
              loadingIcon
            ) : node.isExpanded ? (
              <CaretDownOutlined onClick={expand} />
            ) : (
              <CaretRightFilled onClick={expand} />
            ))}
          <span onClick={select} data-selected={node.isSelected} className={titleClassName}>
            {node.title}
          </span>
        </div>
      </div>
      {node.isExpanded &&
        node.children &&
        (node.children.length > 0
          ? node.children.map((child) => <TreeNode key={child.id} node={child} level={level + 1} />)
          : emptyChildrenView?.({ indent: (level + 1) * INDENT }))}
    </>
  );
});

export default observer(
  forwardRef<HTMLDivElement, TreeContext & { className?: string }>(function Tree({ className, ...ctx }, treeRef) {
    return (
      <Context.Provider value={ctx}>
        <div className={className} ref={treeRef}>
          {ctx.tree.roots.map((node) => (
            <TreeNode key={node.id} node={node} level={0} />
          ))}
        </div>
      </Context.Provider>
    );
  }),
);
