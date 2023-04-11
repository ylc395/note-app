import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Layout, { MaterialExplorerViews, ExplorerTypes } from 'model/Layout';
import ViewSwitcher from './ViewSwitcher';
import Search from './Search';
import DirectoryOperations from './DirectoryView/Operations';
import DirectoryView from './DirectoryView';

export default observer(() => {
  const { explorerPanel } = container.resolve(Layout);

  return (
    <div className="box-border flex h-screen flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 mr-4 shrink-0 text-base">素材库</h1>
          <div className="flex">
            <Search />
            <ViewSwitcher />
          </div>
        </div>
        {explorerPanel[ExplorerTypes.Materials] === MaterialExplorerViews.Directory && <DirectoryOperations />}
      </div>
      <DirectoryView />
    </div>
  );
});
