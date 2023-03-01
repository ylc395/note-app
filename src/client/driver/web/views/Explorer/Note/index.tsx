import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Input } from 'antd';
import { useState } from 'react';

import Layout, { NoteExplorerPanel, ExplorerTypes } from 'model/Layout';

import PanelSwitcher from './PanelSwitcher';
import Tree from './Tree';
import CustomView from './CustomView';

export default observer(function NoteExplorer() {
  const { explorerPanel } = container.resolve(Layout);
  const [operationEl, setOperationEl] = useState<HTMLElement | null>(null);

  return (
    <div className="relative h-screen overflow-y-auto overflow-x-hidden">
      <div className="sticky top-0 z-10 mb-2 border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="mb-2 flex items-center justify-between">
          <Input className="mr-4" placeholder="搜索笔记" />
          <PanelSwitcher />
        </div>
        <div className="mt-4 flex" ref={setOperationEl}></div>
      </div>
      {explorerPanel[ExplorerTypes.Notes] === NoteExplorerPanel.Tree && <Tree operationEl={operationEl} />}
      {explorerPanel[ExplorerTypes.Notes] === NoteExplorerPanel.CustomView && <CustomView />}
    </div>
  );
});
