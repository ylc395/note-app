import { type Ref, createContext } from 'react';
import { observer } from 'mobx-react-lite';
import { useCreation } from 'ahooks';

import type { HierarchyEntity } from '../../../../shared/model/entity';
import type { TreeContext } from './context';
import TreeNode from './TreeNode';

interface Props<T extends HierarchyEntity> extends TreeContext<T> {
  className?: string;
  rootTitle?: string;
}

export default observer(
  function Tree<T extends HierarchyEntity>({ className, rootTitle, ...ctx }: Props<T>, treeRef: Ref<HTMLDivElement>) {
    const Context = useCreation(() => createContext<TreeContext<T>>({} as never), []);

    return (
      <Context.Provider value={ctx}>
        <div className={className} ref={treeRef}>
          {rootTitle ? (
            <TreeNode<T> node={{ ...ctx.tree.root, title: rootTitle }} level={0} ctx={Context} />
          ) : (
            ctx.tree.root.children?.map((node) => <TreeNode<T> ctx={Context} key={node.id} node={node} level={0} />)
          )}
        </div>
      </Context.Provider>
    );
  },
  { forwardRef: true },
);
