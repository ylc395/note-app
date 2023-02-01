import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Resizable } from 're-resizable';
import { Input } from 'antd';
import { useRef } from 'react';

import ViewService, { NoteExplorerPanel, ViewTypes } from 'service/ViewService';

import PanelSwitcher from './PanelSwitcher';
import Tree from './Tree';

export default observer(function NoteExplorer() {
  const { explorerPanel } = container.resolve(ViewService);
  const operationNode = useRef<HTMLDivElement>(null);

  return (
    <Resizable enable={{ right: true }} minWidth={200} defaultSize={{ width: 300, height: 'auto' }}>
      <div className="h-screen overflow-y-auto relative">
        <div className="sticky top-0 z-10 bg-white p-2">
          <div className="flex items-center justify-between mb-2">
            <Input className="mr-4" placeholder="搜索笔记" />
            <PanelSwitcher />
          </div>
          <div className="text-center" ref={operationNode}></div>
        </div>
        {explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.Tree && <Tree operationNode={operationNode} />}
      </div>
    </Resizable>
  );
});
