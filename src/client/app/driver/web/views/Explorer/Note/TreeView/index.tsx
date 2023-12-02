import { container } from 'tsyringe';
import { useEffect } from 'react';
import { PlusOutlined } from '@ant-design/icons';
// import clsx from 'clsx';
// import { useDroppable } from '@dnd-kit/core';

import NoteService from 'service/NoteService';
import { EntityTypes } from 'model/entity';
import IconButton from 'web/components/IconButton';
import TreeView from '../../components/TreeView';

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
      entityType={EntityTypes.Note}
      nodeOperation={({ id }) => (
        <IconButton onClick={() => createNote(id)}>
          <PlusOutlined />
        </IconButton>
      )}
    />
  );
}
