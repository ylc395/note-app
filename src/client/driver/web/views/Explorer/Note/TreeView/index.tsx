import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useCreation } from 'ahooks';

import NoteService from 'service/NoteService';
import type { NoteTreeNode } from 'model/note/Tree/type';
import type NoteTree from 'model/note/Tree';
import Tree, { type TreeProps } from 'web/components/Tree';

import NodeTitle from './NodeTitle';
import useDrag from './useDrag';
import useContextmenu from '../useContextmenu';

export default observer(function NoteTreeView({ tree }: { tree?: NoteTree }) {
  const { selectNote, noteTree: _noteTree } = container.resolve(NoteService);
  const noteTree = useCreation(() => tree || _noteTree, [_noteTree, tree]);
  const handleExpand = useCallback<TreeProps<NoteTreeNode>['onExpand']>(
    ({ key }) => noteTree.toggleExpand(key, false),
    [noteTree],
  );
  const titleRender = useCallback<NonNullable<TreeProps<NoteTreeNode>['titleRender']>>(
    (node) => <NodeTitle node={node} />,
    [],
  );
  const { isOver, setNodeRef } = useDrag(noteTree);
  const onContextmenu = useContextmenu();

  useEffect(() => {
    if (!tree) {
      noteTree.loadChildren();
    }
  }, [noteTree, tree]);

  const treeView = useMemo(
    () => (
      <Tree
        multiple
        draggable
        tree={noteTree}
        onContextmenu={onContextmenu}
        titleRender={titleRender}
        onSelect={selectNote}
        onExpand={handleExpand}
      />
    ),
    [handleExpand, noteTree, onContextmenu, selectNote, titleRender],
  );

  return tree ? (
    treeView
  ) : (
    <div
      className={clsx('h-full', {
        'cursor-pointer bg-blue-50': isOver && !noteTree.invalidParentKeys.has(null),
        'cursor-no-drop': isOver && noteTree.invalidParentKeys.has(null),
      })}
      ref={setNodeRef}
    >
      {treeView}
    </div>
  );
});
