import { container } from 'tsyringe';
import { useEffect } from 'react';
import clsx from 'clsx';

import NoteService from 'service/NoteService';
import TreeView from '../../components/TreeView';

import useDnd from './useDnd';
import { EntityTypes } from 'model/entity';
import { PlusOutlined } from '@ant-design/icons';
import IconButton from 'web/components/IconButton';

// eslint-disable-next-line mobx/missing-observer
export default function NoteTreeView() {
  const { noteTree, loadChildren, createNote } = container.resolve(NoteService);
  const { isOver, setDroppableRef } = useDnd();

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <div className="scrollbar-stable min-h-0 grow overflow-auto">
      <div
        className={clsx('h-full', {
          'cursor-pointer bg-blue-50': isOver && !noteTree.root.isUndroppable,
          'cursor-no-drop': isOver && noteTree.root.isUndroppable,
        })}
        ref={setDroppableRef}
      >
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
    </div>
  );
}
