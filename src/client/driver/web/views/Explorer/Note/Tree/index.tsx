import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { container } from 'tsyringe';
import { useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Tree, ConfigProvider, theme } from 'antd';

import NoteService from 'service/NoteService';

import Operations from './Operations';
import useContextmenu from './useContextmenu';

const { useToken } = theme;

export default observer(function NoteTree({ operationEl: operationNode }: { operationEl: HTMLElement | null }) {
  const { token } = useToken();
  const {
    noteTree: { roots, loadChildren, toggleExpand, expandedNodes, selectedNodes },
    selectNote,
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
          icon={getIcon}
          treeData={toJS(roots)}
          expandedKeys={Array.from(expandedNodes)}
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
