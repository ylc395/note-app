import { observer } from 'mobx-react-lite';
import uniqueId from 'lodash/uniqueId';
import { useCreation } from 'ahooks';

import type { TreeNode } from 'model/abstract/Tree';
import { TreeContext, type ITreeContext } from './treeContext';
import TreeNodeView from './Node';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TreeProps<T extends TreeNode<any>> = Omit<ITreeContext<T>, 'id'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default observer(function Tree<T extends TreeNode<any>>({ tree, ...props }: TreeProps<T>) {
  const id = useCreation(() => uniqueId('tree-view-'), []);

  return (
    <TreeContext.Provider value={{ ...props, id, tree } as unknown as ITreeContext}>
      <div>
        {tree.roots.map((node) => (
          <TreeNodeView key={node.key} node={node} level={0} />
        ))}
      </div>
    </TreeContext.Provider>
  );
});
