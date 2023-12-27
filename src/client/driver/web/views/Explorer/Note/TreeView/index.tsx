import { container } from 'tsyringe';
import { PlusOutlined } from '@ant-design/icons';

import Explorer from '@domain/app/model/note/Explorer';
import { EntityTypes } from '@shared/domain/model/entity';
import { Workbench } from '@domain/app/model/workbench';
import NoteService from '@domain/app/service/NoteService';

import Button from '@web/components/Button';
import TreeView from '../../components/TreeView';
// import SearchInput from '../../components/SearchInput';

// eslint-disable-next-line mobx/missing-observer
export default function NoteTreeView() {
  const { createNote, moveNotes } = container.resolve(NoteService);
  const { tree, showContextmenu, updateTreeForDropping, reset: resetTree } = container.resolve(Explorer);
  const { openEntity } = container.resolve(Workbench);

  return (
    <>
      {/* <SearchInput entityType={EntityTypes.Note} /> */}
      <TreeView
        tree={tree}
        onClick={({ id }) =>
          tree.selectedNodes.length === 1 && openEntity({ entityType: EntityTypes.Note, entityId: id })
        }
        onContextmenu={showContextmenu}
        onDragStop={resetTree}
        onDragStart={updateTreeForDropping}
        onDrop={(item, node) => moveNotes(node.id, item)}
        nodeOperation={({ id }) => (
          <Button onClick={() => createNote(id)}>
            <PlusOutlined />
          </Button>
        )}
      />
    </>
  );
}
