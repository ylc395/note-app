import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import NoteService from '@domain/app/service/NoteService';
import NoteExplorer from '@domain/app/model/note/Explorer';

import ExplorerHeader from '../common/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
import TargetTreeModal from './TargetTreeModal';
import { useDragItem } from '@web/components/dnd/hooks';

export default observer(function NoteExplorerView() {
  const { item: dragItem } = useDragItem();
  const {
    move: { byItems: moveNotesByItems },
  } = container.resolve(NoteService);

  const {
    tree,
    dnd: { status },
  } = container.resolve(NoteExplorer);

  const canDrop = useMemo(
    () => status === 'toDrop' && !tree.root.isDisabled && NoteService.getNoteIds(dragItem),
    [tree.root.isDisabled, dragItem, status],
  );
  const onDrop = canDrop ? (item: unknown) => moveNotesByItems(null, item) : undefined;

  return (
    <>
      <ExplorerHeader onDrop={onDrop} title="笔记">
        <TreeOperations />
      </ExplorerHeader>
      <TreeView />
      <TargetTreeModal />
    </>
  );
});
