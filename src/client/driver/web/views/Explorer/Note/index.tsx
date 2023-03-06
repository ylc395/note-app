import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Layout, { NoteExplorerPanel, ExplorerTypes } from 'model/Layout';

import PanelSwitcher from './PanelSwitcher';
import Tree from './TreeView';
import TreeOperations from './TreeView/Operations';
import CustomView from './CustomView';

export default observer(function NoteExplorer() {
  const { explorerPanel } = container.resolve(Layout);

  return (
    <div className="flex h-screen flex-col ">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-base">笔记本</h1>
          <PanelSwitcher />
        </div>
        {explorerPanel[ExplorerTypes.Notes] === NoteExplorerPanel.Tree && <TreeOperations />}
      </div>
      <div className="min-h-0 grow overflow-y-auto overflow-x-hidden">
        {explorerPanel[ExplorerTypes.Notes] === NoteExplorerPanel.Tree && <Tree />}
        {explorerPanel[ExplorerTypes.Notes] === NoteExplorerPanel.CustomView && <CustomView />}
      </div>
    </div>
  );
});
