import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Resizable } from 're-resizable';
import { Input } from 'antd';
import { useState } from 'react';

import ViewService, { NoteExplorerPanel, ViewTypes } from 'service/ViewService';

import PanelSwitcher from './PanelSwitcher';
import Tree from './Tree';
import CustomView from './CustomView';

export default observer(function NoteExplorer() {
  const { explorerPanel } = container.resolve(ViewService);
  const [operationEl, setOperationEl] = useState<HTMLElement | null>(null);

  return (
    <Resizable enable={{ right: true }} minWidth={220} defaultSize={{ width: 300, height: 'auto' }}>
      <div className="h-screen overflow-y-auto overflow-x-hidden relative">
        <div className="sticky top-0 z-10 bg-white p-2 mb-2  border-gray-200 border-solid border-0 border-b">
          <div className="flex items-center justify-between mb-2">
            <Input className="mr-4" placeholder="搜索笔记" />
            <PanelSwitcher />
          </div>
          <div className="flex mt-4" ref={setOperationEl}></div>
        </div>
        {explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.Tree && <Tree operationEl={operationEl} />}
        {explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.CustomView && <CustomView />}
      </div>
    </Resizable>
  );
});
