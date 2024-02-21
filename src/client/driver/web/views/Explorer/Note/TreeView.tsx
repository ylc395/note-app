import { container } from 'tsyringe';
import { PlusOutlined } from '@ant-design/icons';

import Explorer from '@domain/app/model/note/Explorer';
import { EntityTypes } from '@shared/domain/model/entity';
import { Workbench } from '@domain/app/model/workbench';
import NoteService from '@domain/app/service/NoteService';

import Button from '@web/components/Button';
import TreeView from '../common/TreeView';
import { observer } from 'mobx-react-lite';

export default observer(function NoteTreeView() {
  const {
    createNote,
    move: { byItems: moveNotesByItems },
  } = container.resolve(NoteService);
  const {
    tree,
    contextmenu: { use: showContextmenu },
    dnd: { updateTreeForDropping, reset: resetTree },
    rename: { id: editingId, submit: submitEditing, cancel: cancelEditing },
  } = container.resolve(Explorer);
  const { openEntity } = container.resolve(Workbench);

  return (
    <TreeView
      editingNodeId={editingId}
      onEditEnd={submitEditing}
      onEditCancel={cancelEditing}
      tree={tree}
      onClick={({ id }, isMultiple) => !isMultiple && openEntity({ entityType: EntityTypes.Note, entityId: id })}
      onContextmenu={showContextmenu}
      onDragStop={resetTree}
      onDragStart={updateTreeForDropping}
      onDrop={(item, node) => moveNotesByItems(node.id, item)}
      nodeOperation={({ id }) => (
        <Button onClick={() => createNote({ parentId: id })}>
          <PlusOutlined />
        </Button>
      )}
    />
  );
});
