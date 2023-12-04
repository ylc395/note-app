import { container } from 'tsyringe';
// import Modal from '@components/Modal';
import useModal from '@components/Modal/useModal';

import ExplorerHeader from '../components/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
// import TargetTree from './TargetTree';
// import MetadataForm from './MetadataForm';
import Context from './Context';
import Explorer from '@domain/model/Explorer';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorer() {
  const editingModal = useModal();
  const movingModal = useModal();
  const { noteTree } = container.resolve(Explorer);

  return (
    <Context.Provider value={{ editingModal, movingModal }}>
      <ExplorerHeader tree={noteTree} title="笔记">
        <TreeOperations />
      </ExplorerHeader>
      <TreeView />
      {/* <Modal open={movingModal.isOpen}>
        <TargetTree />
      </Modal> */}
      {/* <Modal open={editingModal.isOpen}>
          <MetadataForm />
        </Modal> */}
    </Context.Provider>
  );
});
