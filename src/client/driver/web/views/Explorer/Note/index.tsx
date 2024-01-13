import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import NoteService from '@domain/app/service/NoteService';
import NoteExplorer from '@domain/app/model/note/Explorer';

import ExplorerHeader from '../components/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
import TargetTreeModal from './TargetTreeModal';
import { useDragItem } from '@web/components/dnd/hooks';

export default observer(function NoteExplorerView() {
  const { moveNotes, getNoteIds } = container.resolve(NoteService);
  const { tree, status } = container.resolve(NoteExplorer);
  const { item: dragItem } = useDragItem();
  const canDrop = useMemo(
    () => status === 'toDrop' && !tree.root.isDisabled && getNoteIds(dragItem),
    [tree.root.isDisabled, dragItem, status, getNoteIds],
  );
  const onDrop = canDrop ? (item: unknown) => moveNotes(null, item) : undefined;

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
