import { container } from 'tsyringe';
import { useModal } from '@components/Modal';
import Explorer from '@domain/model/Explorer';

import ExplorerHeader from '../components/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
import TargetTreeModal from './TargetTreeModal';
import ctx from './context';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorer() {
  const editingModal = useModal();
  const movingModal = useModal();
  const { noteTree } = container.resolve(Explorer);

  return (
    <ctx.Provider value={{ editingModal, movingModal }}>
      <ExplorerHeader tree={noteTree} title="笔记">
        <TreeOperations />
      </ExplorerHeader>
      <TreeView />
      <TargetTreeModal />
    </ctx.Provider>
  );
});
