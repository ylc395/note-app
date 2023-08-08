import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Layout, { NoteExplorerViews, ExplorerTypes } from 'model/Layout';
import Modal from 'web/components/Modal';
import useModal from 'web/components/Modal/useModal';

import Tree from './TreeView';
import TreeOperations from './TreeView/Operations';
import Search from './Search';
import CustomView from './CustomView';
import TargetTree from './TargetTree';
// import MetadataForm from './MetadataForm';
import Context from './Context';

export default observer(function NoteExplorer() {
  const { explorerPanel } = container.resolve(Layout);
  const editingModal = useModal();
  const movingModal = useModal();

  return (
    <Context.Provider value={{ editingModal, movingModal }}>
      <div className="box-border flex h-full flex-col pt-1">
        <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
          <div className="flex items-center justify-between">
            <h1 className="m-0 mr-4 shrink-0 text-base">笔记本</h1>
            <Search />
          </div>
          {explorerPanel[ExplorerTypes.Notes] === NoteExplorerViews.Tree && <TreeOperations />}
        </div>
        <div className="min-h-0 grow overflow-y-auto">
          {explorerPanel[ExplorerTypes.Notes] === NoteExplorerViews.Tree && <Tree />}
          {explorerPanel[ExplorerTypes.Notes] === NoteExplorerViews.Custom && <CustomView />}
        </div>
        <Modal open={movingModal.isOpen}>
          <TargetTree />
        </Modal>
        {/* <Modal open={editingModal.isOpen}>
          <MetadataForm />
        </Modal> */}
      </div>
    </Context.Provider>
  );
});
