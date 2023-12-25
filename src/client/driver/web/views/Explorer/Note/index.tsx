import { container } from 'tsyringe';
import { useMemo } from 'react';
import { useDragDropManager } from 'react-dnd';

import NoteService from '@domain/app/service/NoteService';
import { useModal } from '@web/components/Modal';
import Droppable from '@web/components/dnd/Droppable';

import ExplorerHeader from '../components/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
import TargetTreeModal from './TargetTreeModal';
import ctx from './context';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorer() {
  const { canMoveTo, moveNotes } = container.resolve(NoteService);
  const editingModal = useModal();
  const movingModal = useModal();
  const draggingItem = useDragDropManager().getMonitor().getItem();
  const canDrop = useMemo(() => canMoveTo(null, draggingItem), [draggingItem, canMoveTo]);

  return (
    <ctx.Provider value={{ editingModal, movingModal }}>
      <Droppable onDrop={() => moveNotes(null, draggingItem)}>
        <ExplorerHeader title="笔记" canDrop={canDrop}>
          <TreeOperations />
        </ExplorerHeader>
      </Droppable>
      <TreeView />
      <TargetTreeModal />
    </ctx.Provider>
  );
});
