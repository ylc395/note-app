import { container } from 'tsyringe';
import { useEffect } from 'react';
import { PlusOutlined } from '@ant-design/icons';

import Explorer from '@domain/model/Explorer';
import { EntityTypes } from '@domain/model/entity';
import { Workbench } from '@domain/model/workbench';
import NoteService from '@domain/service/NoteService';

import Button from '@components/Button';
import TreeView from '../../components/TreeView';
// import SearchInput from '../../components/SearchInput';
import useContextmenu from './useContextmenu';

// eslint-disable-next-line mobx/missing-observer
export default function NoteTreeView() {
  const { createNote } = container.resolve(NoteService);
  const { noteTree } = container.resolve(Explorer);
  const { openEntity } = container.resolve(Workbench);
  const handleContextmenu = useContextmenu();

  useEffect(() => {
    noteTree.loadChildren();
  }, [noteTree]);

  return (
    <>
      {/* <SearchInput entityType={EntityTypes.Note} /> */}
      <TreeView
        tree={noteTree}
        onClick={(id) => openEntity({ entityType: EntityTypes.Note, entityId: id })}
        onContextmenu={handleContextmenu}
        nodeOperation={({ id }) => (
          <Button onClick={() => createNote(id)}>
            <PlusOutlined />
          </Button>
        )}
      />
    </>
  );
}
