import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { AiOutlinePlus, AiOutlineShrink, AiOutlineSetting } from 'react-icons/ai';
import { useMemo } from 'react';

import NoteService from '@domain/app/service/NoteService';
import NoteExplorer from '@domain/app/model/note/Explorer';
import { useDragItem } from '@web/components/dnd/hooks';
import ExplorerHeader from '../common/ExplorerHeader';

export default observer(function Header() {
  const {
    tree: { root, collapseAll, hasExpandedNode },
    dnd: { status },
  } = container.resolve(NoteExplorer);
  const {
    move: { byItems: moveNotesByItems },
    createNote,
  } = container.resolve(NoteService);

  const { item: dragItem } = useDragItem();
  const canDrop = useMemo(
    () => status === 'toDrop' && !root.isDisabled && NoteService.getNoteIds(dragItem),
    [root.isDisabled, dragItem, status],
  );
  const onDrop = canDrop ? (item: unknown) => moveNotesByItems(null, item) : undefined;

  return (
    <ExplorerHeader
      left={[{ icon: <AiOutlinePlus />, onClick: createNote }]}
      right={[
        { icon: <AiOutlineShrink />, onClick: collapseAll, disabled: !hasExpandedNode },
        { icon: <AiOutlineSetting />, onClick: () => {} },
      ]}
      onDrop={onDrop}
      title="笔记"
    />
  );
});
