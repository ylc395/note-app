import { container } from 'tsyringe';
import { PlusIcon } from 'lucide-react';

import Explorer from '@domain/app/model/note/Explorer';
import { EntityTypes } from '@shared/domain/model/entity';
import { Workbench } from '@domain/app/model/workbench';
import NoteService from '@domain/app/service/NoteService';

import Button from '@web/components/Button';
import TreeView from '../common/ExplorerTree';
import useContextmenu from './useContextmenu';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteTreeView() {
  const { createNote } = container.resolve(NoteService);

  const explorer = container.resolve(Explorer);
  const { openEntity } = container.resolve(Workbench);

  return (
    <TreeView
      getContextmenuItems={useContextmenu()}
      explorer={explorer}
      onClick={({ id }, isMultiple) => !isMultiple && openEntity({ entityType: EntityTypes.Note, entityId: id })}
      nodeOperation={({ id }) => (
        <Button icon={<PlusIcon />} variant="primary" onClick={() => createNote({ parentId: id })} size="small" />
      )}
    />
  );
});
