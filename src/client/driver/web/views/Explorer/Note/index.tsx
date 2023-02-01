import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Resizable } from 're-resizable';
import { Button, Tooltip, Input, Space } from 'antd';
import { MenuFoldOutlined } from '@ant-design/icons';

import ViewService, { NoteExplorerPanel, ViewTypes } from 'service/ViewService';
import NoteService from 'service/NoteService';

import PanelSwitcher from './PanelSwitcher';
import Tree from './Tree';
import { useCallback } from 'react';

export default observer(function NoteExplorer() {
  const { createNote } = container.resolve(NoteService);
  const { explorerVisible, toggleExplorerVisibility, explorerPanel } = container.resolve(ViewService);
  const toggleVisibility = useCallback(() => toggleExplorerVisibility(ViewTypes.Notes), [toggleExplorerVisibility]);

  return (
    <Resizable
      className={explorerVisible[ViewTypes.Notes] ? '' : 'hidden'}
      enable={{ right: true }}
      minWidth={200}
      defaultSize={{ width: 300, height: 'auto' }}
    >
      <div className="h-screen overflow-y-auto relative">
        <div className="sticky flex items-center justify-between top-0 z-10 p-2 bg-white">
          <Input className="w-60 mr-4" placeholder="搜索笔记标题" />
          <Space className="flex items-center">
            <PanelSwitcher />
            <Tooltip title="折叠该栏">
              <Button icon={<MenuFoldOutlined />} onClick={toggleVisibility} />
            </Tooltip>
          </Space>
        </div>
        {/* <Space className="flex items-center">
            <Tooltip title="新建笔记">
              <Button type="primary" icon={<FileAddOutlined />} onClick={createNote} />
            </Tooltip>
            <Button icon={<SortAscendingOutlined />} onClick={createNote} />
          </Space> */}
        {explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.Tree && <Tree />}
      </div>
    </Resizable>
  );
});
