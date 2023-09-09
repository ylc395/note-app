import { container } from 'tsyringe';
import { useEffect } from 'react';
import clsx from 'clsx';

import NoteService from 'service/NoteService';
import Tree from 'components/Tree';

import NodeTitle from './NodeTitle';
import useDnd from './useDnd';

// eslint-disable-next-line mobx/missing-observer
export default function NoteTreeView() {
  const { noteTree, loadChildren } = container.resolve(NoteService);
  const { isOver, setDroppableRef } = useDnd();

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <div
      className={clsx('h-full', {
        'cursor-pointer bg-blue-50': isOver && !noteTree.root.isUndroppable,
        'cursor-no-drop': isOver && noteTree.root.isUndroppable,
      })}
      ref={setDroppableRef}
    >
      <Tree
        draggable
        droppable
        nodeClassName="tree-node"
        tree={noteTree}
        multiple
        renderTitle={(node) => <NodeTitle node={node} />}
      />
    </div>
  );
}
