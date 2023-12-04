import { observer } from 'mobx-react-lite';

import type { HierarchyEntity } from '@shared/domain/model/entity';
import TreeNode from './TreeNode';
import type { TreeProps } from './types';

export default observer(function Tree<T extends HierarchyEntity>({ className, rootTitle, ...ctx }: TreeProps<T>) {
  return (
    <div className={className}>
      {rootTitle ? (
        <TreeNode<T> node={{ ...ctx.tree.root, title: rootTitle }} level={0} {...ctx} />
      ) : (
        ctx.tree.root.children?.map((node) => <TreeNode<T> key={node.id} node={node} level={0} {...ctx} />)
      )}
    </div>
  );
});
