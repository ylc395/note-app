import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect } from 'react';
import clsx from 'clsx';

import NoteService from 'service/NoteService';
import type { NoteTreeNode } from 'model/note/Tree';
import Tree, { type TreeProps } from 'web/components/Tree';

import NodeTitle from './NodeTitle';
import useDrag from './useDrag';
import useContextmenu from './useContextmenu';

export default observer(function NoteTreeView() {
  const { selectNote, noteTree } = container.resolve(NoteService);
  const handleExpand = useCallback<NonNullable<TreeProps<NoteTreeNode>['onExpand']>>(
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
    noteTree.loadChildren();
  }, [noteTree]);

  return (
    <div
      className={clsx('h-full', {
        'cursor-pointer bg-blue-50': isOver && !noteTree.invalidParentKeys.has(null),
        'cursor-no-drop': isOver && noteTree.invalidParentKeys.has(null),
      })}
      ref={setNodeRef}
    >
      <Tree
        multiple
        draggable
        tree={noteTree}
        onContextmenu={onContextmenu}
        titleRender={titleRender}
        onSelect={selectNote}
        onExpand={handleExpand}
      />
    </div>
  );
});
