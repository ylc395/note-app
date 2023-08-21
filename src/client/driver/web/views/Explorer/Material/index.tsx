import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Layout, { MaterialExplorerViews, ExplorerTypes } from 'model/Layout';
import MaterialService from 'service/MaterialService';
import Modal from 'web/components/Modal';

import Search from './Search';
import DirectoryOperations from './TreeView/Operations';
import DirectoryView from './TreeView';
import NewMaterial from './NewMaterial';

export default observer(() => {
  const { explorerPanel } = container.resolve(Layout);
  const { targetId } = container.resolve(MaterialService);

  return (
    <div className="box-border flex h-full flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 mr-4 shrink-0 text-base">素材库</h1>
          <Search />
        </div>
        {explorerPanel[ExplorerTypes.Materials] === MaterialExplorerViews.Directory && <DirectoryOperations />}
      </div>
      <DirectoryView />
      <Modal open={Boolean(targetId.value)}>
        <NewMaterial />
      </Modal>
    </div>
  );
});
