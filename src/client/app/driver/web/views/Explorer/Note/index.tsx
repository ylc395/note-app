import { observer } from 'mobx-react-lite';

// import Modal from 'web/components/Modal';
import useModal from 'web/components/Modal/useModal';

import ExplorerHeader from '../components/ExplorerHeader';
import TreeView from './TreeView';
import TreeOperations from './Operations';
// import TargetTree from './TargetTree';
// import MetadataForm from './MetadataForm';
import Context from './Context';

export default observer(function NoteExplorer() {
  const editingModal = useModal();
  const movingModal = useModal();

  return (
    <Context.Provider value={{ editingModal, movingModal }}>
      <ExplorerHeader title="笔记本">
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
