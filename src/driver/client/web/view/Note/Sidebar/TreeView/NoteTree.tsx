import { onCleanup } from 'solid-js';
import { NoteTypes } from '#domain/shared/model/note';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';

import BaseTreeView from './BaseTree';
import NoteAddButton from './AddButton/Note';

export default function NoteTree() {
  const { workbench, initTreeView } = container.resolve(NoteService);
  const tree = initTreeView(NoteTypes.Note);

  onCleanup(() => tree.destroy());

  return (
    <BaseTreeView
      treeView={tree}
      onItemTitleClick={(node) => node.value && workbench.open(node.value)}
      operation={(node) => (
        <NoteAddButton
          iconOnly
          node={node}
          buttonClassName="btn btn-xs btn-square mx-1 group-hover:inline-flex hidden"
        />
      )}
    />
  );
}
