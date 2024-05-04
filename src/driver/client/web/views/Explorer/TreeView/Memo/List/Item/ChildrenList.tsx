import { observer } from 'mobx-react-lite';
import assert from 'assert';

import ListItem from './index';
import MemoTreeNode from '@domain/client/app/model/memo/TreeNode';
import Editor from '../../Editor';

export default observer(function ChildrenList({ node }: { node: MemoTreeNode }) {
  return (
    <div>
      <Editor isChild node={node} />
      <div className="pl-2">
        {node.sortedChildren.map((childMemoNode) => {
          assert(childMemoNode.memo);
          return <ListItem key={childMemoNode.memo.id} node={childMemoNode} />;
        })}
      </div>
    </div>
  );
});
