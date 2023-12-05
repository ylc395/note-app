import { container } from 'tsyringe';
import { useEffect } from 'react';
import { PlusOutlined } from '@ant-design/icons';

import { EntityTypes } from '@domain/model/entity';
import Explorer from '@domain/model/Explorer';
import NoteService from '@domain/service/NoteService';
import IconButton from '@components/IconButton';
import TreeView from '../../components/TreeView';
import useContextmenu from './useContextmenu';

// eslint-disable-next-line mobx/missing-observer
export default function NoteTreeView() {
  const { createNote } = container.resolve(NoteService);
  const { noteTree } = container.resolve(Explorer);
  const handleContextmenu = useContextmenu();

  useEffect(() => {
    noteTree.loadChildren();
  }, [noteTree]);

  return (
    <>
      <TreeView
        tree={noteTree}
        entityType={EntityTypes.Note}
        onContextmenu={handleContextmenu}
        nodeOperation={({ id }) => (
          <IconButton onClick={() => createNote(id)}>
            <PlusOutlined />
          </IconButton>
        )}
      />
    </>
  );
}
