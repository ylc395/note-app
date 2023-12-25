import { container } from 'tsyringe';
import { useDragDropManager } from 'react-dnd';

import NoteService from '@domain/app/service/NoteService';
import { useModal } from '@web/components/Modal';
import Droppable from '@web/components/dnd/Droppable';
import NoteExplorer from '@domain/app/model/note/Explorer';

import ExplorerHeader from '../components/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
import TargetTreeModal from './TargetTreeModal';
import ctx from './context';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorerView() {
  const { moveNotes } = container.resolve(NoteService);
  const { tree } = container.resolve(NoteExplorer);
  const editingModal = useModal();
  const movingModal = useModal();
  const draggingItem = useDragDropManager().getMonitor().getItem();

  return (
    <ctx.Provider value={{ editingModal, movingModal }}>
      <Droppable onDrop={() => !tree.root.isDisabled && moveNotes(null, draggingItem)}>
        <ExplorerHeader title="笔记">
          <TreeOperations />
        </ExplorerHeader>
      </Droppable>
      <TreeView />
      <TargetTreeModal />
    </ctx.Provider>
  );
});
