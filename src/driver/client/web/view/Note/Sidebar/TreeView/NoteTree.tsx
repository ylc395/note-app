import { NoteTypes } from '#domain/shared/model/note';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';

import BaseTreeView, { addButtonClassName } from './BaseTree';
import NoteAddButton from './AddButton/Note';

export default function NoteTree() {
  const { workbench, getOrCreateTreeView } = container.resolve(NoteService);
  const tree = getOrCreateTreeView(NoteTypes.Document);

  return (
    <BaseTreeView
      treeView={tree}
      onItemTitleClick={(node) => node.value && workbench.open(node.value)}
      renderOperation={(node) => <NoteAddButton iconOnly node={node} buttonClassName={addButtonClassName} />}
    />
  );
}
