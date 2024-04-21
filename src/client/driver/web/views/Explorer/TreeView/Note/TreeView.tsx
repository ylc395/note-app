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
  const { createNote } = container.resolve(NoteService);

  const {
    tree,
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
      nodeOperation={({ id }) => (
        <Button icon={<PlusIcon />} variant="primary" onClick={() => createNote({ parentId: id })} size="small" />
      )}
    />
  );
});
