import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { container } from 'tsyringe';
import { useEffect, type MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { Tree, Button, Dropdown, Tooltip, DropDownProps } from 'antd';
import { SortAscendingOutlined, FileAddOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';
import WorkbenchService from 'service/WorkbenchService';

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
  const {
    noteTree: { roots, loadChildren, getNote },
    createNote,
  } = container.resolve(NoteService);
  const { open } = container.resolve(WorkbenchService);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <>
      <Tree
        treeData={toJS(roots)}
        blockNode
        className="bg-transparent"
        loadData={(node) => loadChildren(node.key)}
        onSelect={(keys) => open({ type: 'note', entity: getNote(keys[0] as string) }, false)}
      />
      {operationNode.current &&
        createPortal(
          <>
            <Tooltip title="新建根笔记" placement="top">
              <Button type="text" icon={<FileAddOutlined />} onClick={createNote} />
            </Tooltip>
            <Dropdown menu={{ items: sortOptions }}>
              <Button type="text" icon={<SortAscendingOutlined />} />
            </Dropdown>
          </>,
          operationNode.current,
        )}
    </>
  );
});
