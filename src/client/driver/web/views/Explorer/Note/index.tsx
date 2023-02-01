import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Resizable } from 're-resizable';
import { Button, Tooltip, Input, Space } from 'antd';
import { PlusOutlined, SortAscendingOutlined } from '@ant-design/icons';

import ViewService, { NoteExplorerPanel, ViewTypes } from 'service/ViewService';
import NoteService from 'service/NoteService';

import PanelSwitcher from './PanelSwitcher';
import Tree from './Tree';

export default observer(function NoteExplorer() {
  const { createNote } = container.resolve(NoteService);
  const { explorerPanel } = container.resolve(ViewService);

  return (
    <Resizable enable={{ right: true }} minWidth={200} defaultSize={{ width: 300, height: 'auto' }}>
      <div className="h-screen overflow-y-auto relative">
        <div className="sticky top-0 z-10 bg-white p-2">
          <div className="flex items-center justify-between mb-2">
            <Input className="mr-4" placeholder="搜索笔记" />
            <PanelSwitcher />
          </div>
          {explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.Tree && (
            <Space className="flex items-center">
              <Tooltip title="新建根笔记">
                <Button size="small" icon={<PlusOutlined />} onClick={createNote} />
              </Tooltip>
              <Button size="small" icon={<SortAscendingOutlined />} onClick={createNote} />
            </Space>
          )}
        </div>
        {explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.Tree && <Tree />}
      </div>
    </Resizable>
  );
});
