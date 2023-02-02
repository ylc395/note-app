import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { container } from 'tsyringe';
import { useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Tree, ConfigProvider, theme, type TreeProps } from 'antd';
import type { AntdTreeNodeAttribute } from 'antd/es/tree';
import { ShrinkOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';

import Operations from './Operations';

const { useToken } = theme;

export default observer(function NoteTree({ operationEl: operationNode }: { operationEl: HTMLElement | null }) {
  const { token } = useToken();
  const {
    noteTree: { roots, loadChildren, getNote, toggleExpand, expandedNodes, selectedNodes },
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
    return operationNode && createPortal(<Operations />, operationNode);
  }, [operationNode]);

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
