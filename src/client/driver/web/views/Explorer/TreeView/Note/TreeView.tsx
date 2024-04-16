import { container } from 'tsyringe';
import { PlusIcon } from 'lucide-react';
import { observer } from 'mobx-react-lite';

import Explorer from '@domain/app/model/note/Explorer';
import { EntityTypes } from '@shared/domain/model/entity';
import { Workbench } from '@domain/app/model/workbench';
import NoteService from '@domain/app/service/NoteService';

import Button from '@web/components/Button';
import TreeView from '../common/Tree';
import useContextmenu from './useContextmenu';

export default observer(function NoteTreeView() {
  const {
    createNote,
    move: { moveByItems: moveNotesByItems },
  } = container.resolve(NoteService);

  const {
    tree,
    dnd: { updateTreeForDropping, reset: resetTree },
    rename: { id: editingId, submit: submitEditing, cancel: cancelEditing },
  } = container.resolve(Explorer);
  const { openEntity } = container.resolve(Workbench);
  const contextmenu = useContextmenu();

  return (
    <TreeView
      {...contextmenu}
      editingNodeId={editingId}
      onEditEnd={submitEditing}
      onEditCancel={cancelEditing}
      tree={tree}
      onClick={({ id }, isMultiple) => !isMultiple && openEntity({ entityType: EntityTypes.Note, entityId: id })}
      onDragStop={resetTree}
      onDragStart={updateTreeForDropping}
      onDrop={(item, node) => moveNotesByItems(node.id, item)}
      nodeOperation={({ id }) => (
        <Button icon={<PlusIcon />} variant="primary" onClick={() => createNote({ parentId: id })} size="small" />
      )}
    />
  );
});
