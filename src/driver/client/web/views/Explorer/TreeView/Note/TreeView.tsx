import { PlusIcon } from 'lucide-react';

import Explorer from '#domain/client/app/model/note/Explorer';
import NoteService from '#domain/client/app/service/NoteService';

import Button from '#web/components/Button';
import TreeView from '../common/ExplorerTree';
import { container } from '#domain/shared/infra/singletons';
import Workbench from '#domain/client/app/model/workbench/Workbench';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteTreeView() {
  const { createNote } = container.resolve(NoteService);

  const explorer = container.resolve(Explorer);
  const { openEntity } = container.resolve(Workbench);

  return (
    <TreeView
      explorer={explorer}
      onClick={({ entityLocator }) => openEntity(entityLocator!)}
      renderNodeOperation={({ id }) => (
        <Button icon={<PlusIcon />} variant="primary" onClick={() => createNote({ parentId: id })} size="tiny" />
      )}
    />
  );
});
