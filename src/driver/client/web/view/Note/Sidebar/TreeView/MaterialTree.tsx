import { FolderIcon, FolderOpenIcon } from 'lucide-solid';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';

import BaseTreeView from './Tree';
import MaterialAddButton from './AddButton/Material';

export default function MaterialTree() {
  const {
    treeViews: { material: materialTreeView },
  } = container.resolve(NoteService);

  return (
    <BaseTreeView
      operation={(node) => (
        <MaterialAddButton
          triggerClassName="group-hover:visible invisible absolute right-0 bg-gray-200"
          iconOnly
          noteId={node.id}
        />
      )}
      treeView={materialTreeView}
      useNewNoteEditor
      icon={(node) =>
        node.value?.mimeType ? null : node.isExpanded ? (
          <FolderOpenIcon class="mr-1 shrink-0" />
        ) : (
          <FolderIcon class="mr-1 shrink-0" />
        )
      }
    />
  );
}
