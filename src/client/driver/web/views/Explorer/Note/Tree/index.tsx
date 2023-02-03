import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { container } from 'tsyringe';
import { useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Tree, ConfigProvider, theme, Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';

import Operations from './Operations';
import useContextmenu from './useContextmenu';

const { useToken } = theme;

export default observer(function NoteTree({ operationEl: operationNode }: { operationEl: HTMLElement | null }) {
  const { token } = useToken();
  const {
    noteTree: { roots, loadChildren, toggleExpand, expandedNodes, selectedNodes, loadedNodes },
    selectNote,
    createNote,
  } = container.resolve(NoteService);

  const operations = useMemo(() => {
    return operationNode && createPortal(<Operations />, operationNode);
  }, [operationNode]);

  const handleContextmenu = useContextmenu();
  const getIcon = useCallback(() => null, []);

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
          titleRender={(node) => (
            <span className="flex group">
              <span className="whitespace-nowrap">{node.title}</span>
              <Tooltip title="新建子笔记" placement="right">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    createNote(node.note);
                  }}
                  className="invisible ml-auto mr-2 group-hover:visible"
                  size="small"
                  type="text"
                  icon={<PlusOutlined />}
                />
              </Tooltip>
            </span>
          )}
          icon={getIcon}
          treeData={toJS(roots)}
          expandedKeys={Array.from(expandedNodes)}
          loadedKeys={Array.from(loadedNodes)}
          selectedKeys={Array.from(selectedNodes)}
          expandAction={false}
          loadData={(node) => loadChildren(node.note)}
          onExpand={(_, { node }) => toggleExpand(node.note)}
          onSelect={(_, { node, selectedNodes }) => selectNote(node.note, selectedNodes.length > 1)}
          onRightClick={({ node }) => handleContextmenu(node.note)}
        />
      </ConfigProvider>
      {operations}
    </>
  );
});
