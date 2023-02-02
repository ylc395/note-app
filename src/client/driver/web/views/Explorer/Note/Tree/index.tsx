import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { container } from 'tsyringe';
import { useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Tree, Button, Dropdown, Tooltip, ConfigProvider, theme, type TreeProps } from 'antd';
import type { AntdTreeNodeAttribute } from 'antd/es/tree';
import { SortAscendingOutlined, FileAddOutlined, ShrinkOutlined, SettingOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';

import useNoteSort from './useNoteSort';

const { useToken } = theme;

export default observer(function NoteTree({ operationEl: operationNode }: { operationEl: HTMLElement | null }) {
  const { token } = useToken();
  const { menuOptions, handleClick } = useNoteSort();
  const {
    noteTree: { roots, loadChildren, getNote, toggleExpand, expandedNodes, collapseAll, selectedNodes },
    createNote,
    selectNote,
  } = container.resolve(NoteService);

  // todo: move to useIcon
  const getIcon: TreeProps['icon'] = useCallback(
    (props: AntdTreeNodeAttribute) => {
      const id = props.eventKey;
      const note = getNote(id);

      return note.icon ? <ShrinkOutlined /> : null;
    },
    [getNote],
  );

  const operations = useMemo(() => {
    return (
      operationNode &&
      createPortal(
        <>
          <div>
            <Tooltip title="新建根笔记">
              <Button type="text" icon={<FileAddOutlined />} onClick={createNote} />
            </Tooltip>
            <Dropdown menu={{ items: menuOptions.get(), onClick: handleClick }} placement="bottom" arrow>
              <Button type="text" icon={<SortAscendingOutlined />} />
            </Dropdown>
            <Tooltip title="折叠全部节点">
              <Button disabled={expandedNodes.size === 0} type="text" icon={<ShrinkOutlined />} onClick={collapseAll} />
            </Tooltip>
          </div>
          <Tooltip title="笔记树配置" className="ml-auto">
            <Button type="text" icon={<SettingOutlined />} />
          </Tooltip>
        </>,
        operationNode,
      )
    );
  }, [operationNode, createNote, expandedNodes.size, collapseAll, menuOptions, handleClick]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <>
      <ConfigProvider
        theme={{
          components: { Tree: { colorPrimary: token.colorPrimaryBg, colorTextLightSolid: token.colorText } },
        }}
      >
        <Tree.DirectoryTree
          multiple
          icon={getIcon}
          treeData={toJS(roots)}
          expandedKeys={Array.from(expandedNodes)}
          selectedKeys={Array.from(selectedNodes)}
          expandAction={false}
          loadData={(node) => loadChildren(node.key)}
          onExpand={(_, { node }) => toggleExpand(node.key)}
          onSelect={(_, { node, selectedNodes }) => selectNote(node.key, selectedNodes.length > 1)}
        />
      </ConfigProvider>
      {operations}
    </>
  );
});
