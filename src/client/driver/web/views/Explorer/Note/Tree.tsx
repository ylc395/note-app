import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { container } from 'tsyringe';
import { useCallback, useEffect, type MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { Tree, Button, Dropdown, Tooltip, DropDownProps, ConfigProvider, theme, type TreeProps } from 'antd';
import type { AntdTreeNodeAttribute } from 'antd/es/tree';
import { SortAscendingOutlined, FileAddOutlined, ShrinkOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';
import WorkbenchService from 'service/WorkbenchService';

const { useToken } = theme;
const sortOptions: NonNullable<DropDownProps['menu']>['items'] = [
  { key: '1', label: '根据名字排序' },
  { key: '2', label: '根据修改时间排序' },
  { key: '3', label: '根据创建时间排序' },
  { type: 'divider' },
  { key: '4', label: '升序' },
  { key: '5', label: '降序' },
];

export default observer(function NoteTree({
  operationNode,
}: {
  operationNode: MutableRefObject<HTMLDivElement | null>;
}) {
  const { open } = container.resolve(WorkbenchService);
  const { token } = useToken();
  const {
    noteTree: { roots, loadChildren, getNote, toggleExpand, expandedNodes, collapseAll },
    createNote,
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
          expandAction={false}
          loadData={(node) => loadChildren(node.key)}
          onExpand={(_, { node }) => toggleExpand(node.key)}
          onSelect={(_, { selected, node, selectedNodes }) =>
            selected && selectedNodes.length === 1 && open({ type: 'note', entity: getNote(node.key) }, false)
          }
        />
      </ConfigProvider>
      {operationNode.current &&
        createPortal(
          <>
            <Tooltip title="新建根笔记">
              <Button type="text" icon={<FileAddOutlined />} onClick={createNote} />
            </Tooltip>
            <Dropdown menu={{ items: sortOptions }} placement="bottom" arrow>
              <Button type="text" icon={<SortAscendingOutlined />} />
            </Dropdown>
            <Tooltip title="折叠全部节点">
              <Button disabled={expandedNodes.size === 0} type="text" icon={<ShrinkOutlined />} onClick={collapseAll} />
            </Tooltip>
          </>,
          operationNode.current,
        )}
    </>
  );
});
