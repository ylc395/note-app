import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tooltip, Button, Dropdown, type TooltipProps, MenuProps } from 'antd';
import {
  SortAscendingOutlined,
  FileAddOutlined,
  ShrinkOutlined,
  SettingOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useCallback, useMemo } from 'react';

import NoteService from 'service/NoteService';

const tooltipProps: TooltipProps = {
  placement: 'top',
};

// const sortBy = [
//   { key: SortBy.Title, label: '根据名称排序' },
//   { key: SortBy.UpdatedAt, label: '根据修改时间排序' },
//   { key: SortBy.CreatedAt, label: '根据创建时间排序' },
// ] as const;

// const sortOrder = [
//   { key: SortOrder.Asc, label: '升序' },
//   { key: SortOrder.Desc, label: '降序' },
// ] as const;

export default observer(function Operations() {
  const {
    noteTree: { expandedNodes, collapseAll },
    createNote,
  } = container.resolve(NoteService);

  // const sortMenuItems = useMemo<NonNullable<MenuProps['items']>>(() => {
  //   return [
  //     ...sortBy.map(({ key, label }) => ({
  //       key,
  //       label,
  //       icon: sortOptions.by === key && <CheckOutlined />,
  //     })),
  //     { type: 'divider' },
  //     ...sortOrder.map(({ key, label }) => ({
  //       key,
  //       label,
  //       icon: sortOptions.order === key && <CheckOutlined />,
  //     })),
  //   ];
  // }, [sortOptions.by, sortOptions.order]);

  return (
    <div className="mt-2 flex justify-between">
      <div>
        <Tooltip title="新建根笔记" {...tooltipProps}>
          <Button type="text" icon={<FileAddOutlined />} onClick={() => createNote()} />
        </Tooltip>
        {/* <Dropdown
          trigger={['click']}
          menu={{ items: sortMenuItems, onClick: handleSortClick }}
          placement="bottom"
          arrow
        >
          <Tooltip title="设置排序方式" {...tooltipProps}>
            <Button type="text" icon={<SortAscendingOutlined />} />
          </Tooltip>
        </Dropdown> */}
        <Tooltip title="折叠全部节点" {...tooltipProps}>
          <Button disabled={expandedNodes.length === 0} type="text" icon={<ShrinkOutlined />} onClick={collapseAll} />
        </Tooltip>
      </div>
      <Tooltip title="笔记树配置" className="ml-auto" {...tooltipProps}>
        <Button type="text" icon={<SettingOutlined />} />
      </Tooltip>
    </div>
  );
});
