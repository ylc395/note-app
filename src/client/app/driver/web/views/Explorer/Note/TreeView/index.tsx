import { container } from 'tsyringe';
import { useEffect } from 'react';
// import clsx from 'clsx';
// import { useDroppable } from '@dnd-kit/core';

import NoteService from 'service/NoteService';
import TreeView from '../../components/TreeView';

import { EntityTypes } from 'model/entity';
import { PlusOutlined } from '@ant-design/icons';
import IconButton from 'web/components/IconButton';

// eslint-disable-next-line mobx/missing-observer
export default function NoteTreeView() {
  const { noteTree, loadChildren, createNote } = container.resolve(NoteService);
  // const id = useCreation(() => uniqueId('note-tree-view-'), []);
  // const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id, data: { instance: noteTree.root } });

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <div className="scrollbar-stable min-h-0 grow overflow-auto">
      <TreeView
        tree={noteTree}
        entityType={EntityTypes.Note}
        nodeOperation={({ id }) => (
          <IconButton onClick={() => createNote(id)}>
            <PlusOutlined />
          </IconButton>
        )}
      />
    </div>
  );
}
