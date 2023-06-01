import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import type NoteTree from 'model/note/Tree';
import type { NoteTreeNode } from 'model/note/Tree';
import Tree, { type TreeProps } from 'web/components/Tree';

import NodeTitle from './NodeTitle';

export default observer(function NoteTreeView({ tree }: { tree: NoteTree }) {
  const titleRender = useCallback<NonNullable<TreeProps<NoteTreeNode>['titleRender']>>(
    (node) => <NodeTitle node={node} />,
    [],
  );

  return <Tree multiple tree={tree} titleRender={titleRender} />;
});
