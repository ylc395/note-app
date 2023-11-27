import { container } from 'tsyringe';
import { useEffect } from 'react';
// import clsx from 'clsx';
// import { useDroppable } from '@dnd-kit/core';

import NoteService from 'service/NoteService';
import TreeView from '../../components/TreeView';

import { PlusOutlined } from '@ant-design/icons';
import IconButton from 'web/components/IconButton';

// eslint-disable-next-line mobx/missing-observer
export default function NoteTreeView() {
  const { tree: noteTree, loadChildren, createNote } = container.resolve(NoteService);
  // const id = useCreation(() => uniqueId('note-tree-view-'), []);
  // const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id, data: { instance: noteTree.root } });

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <TreeView
      tree={noteTree}
      nodeOperation={({ id }) => (
        <IconButton onClick={() => createNote(id)}>
          <PlusOutlined />
        </IconButton>
      )}
    />
  );
}
