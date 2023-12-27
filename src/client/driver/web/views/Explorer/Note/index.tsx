import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useDragLayer } from 'react-dnd';

import NoteService from '@domain/app/service/NoteService';
import { useModal } from '@web/components/Modal';
import NoteExplorer from '@domain/app/model/note/Explorer';

import ExplorerHeader from '../components/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
import TargetTreeModal from './TargetTreeModal';
import ctx from './context';

export default observer(function NoteExplorerView() {
  const { moveNotes, getNoteIds } = container.resolve(NoteService);
  const { tree, status } = container.resolve(NoteExplorer);
  const editingModal = useModal();
  const movingModal = useModal();
  const { item } = useDragLayer((monitor) => ({ item: monitor.getItem() }));
  const canDrop = useMemo(
    () => status === 'toDrop' && !tree.root.isDisabled && getNoteIds(item),
    [tree.root.isDisabled, item, status],
  );

  return (
    <ctx.Provider value={{ editingModal, movingModal }}>
      <ExplorerHeader onDrop={canDrop ? () => moveNotes(null, item) : undefined} title="笔记">
        <TreeOperations />
      </ExplorerHeader>
      <TreeView />
      <TargetTreeModal />
    </ctx.Provider>
  );
});
