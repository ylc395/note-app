import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';

import BaseTreeView from './Tree';
import NoteAddButton from './AddButton/Note';

export default function NoteTree() {
  const {
    treeViews: { note: noteTreeView },
  } = container.resolve(NoteService);

  return (
    <BaseTreeView
      operation={(node) => (
        <NoteAddButton
          iconOnly
          noteId={node.id}
          triggerClassName="group-hover:visible invisible absolute right-0 bg-gray-200"
        />
      )}
      treeView={noteTreeView}
    />
  );
}
