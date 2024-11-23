import { observer } from 'mobx-react-lite';

import Editor from '../../Editor';
import assert from 'assert';
import type MemoTreeNode from '#domain/client/app/model/memo/ListView/TreeNode';

export default observer(function Body({ node }: { node: MemoTreeNode }) {
  assert(node.memo);

  return (
    <div>
      {node.editor ? (
        <Editor node={node} />
      ) : (
        <div className="min-h-[80px] select-text text-text-primary">{node.memo.body}</div>
      )}
    </div>
  );
});
