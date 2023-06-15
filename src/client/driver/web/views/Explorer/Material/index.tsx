import { observer, useLocalObservable } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Layout, { MaterialExplorerViews, ExplorerTypes } from 'model/Layout';
import Modal from 'web/components/Modal';
import useModal from 'web/components/Modal/useModal';

import Search from './Search';
import DirectoryOperations from './DirectoryView/Operations';
import DirectoryView from './DirectoryView';
import NewMaterial from './NewMaterial';
import Context, { type Context as IContext } from './Context';

export default observer(() => {
  const { explorerPanel } = container.resolve(Layout);
  const newMaterialModal = useModal();
  const context = useLocalObservable<IContext>(() => ({
    newMaterialModal,
    currentMaterialId: null,
    setCurrentMaterialId: function (id) {
      this.currentMaterialId = id;
    },
  }));

  return (
    <Context.Provider value={context}>
      <div className="box-border flex h-screen flex-col pt-1">
        <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
          <div className="flex items-center justify-between">
            <h1 className="m-0 mr-4 shrink-0 text-base">素材库</h1>
            <Search />
          </div>
          {explorerPanel[ExplorerTypes.Materials] === MaterialExplorerViews.Directory && <DirectoryOperations />}
        </div>
        <DirectoryView />
        <Modal open={newMaterialModal.isOpen}>
          <NewMaterial />
        </Modal>
      </div>
    </Context.Provider>
  );
});
