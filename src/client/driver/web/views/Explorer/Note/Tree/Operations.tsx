import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tooltip, Button, Dropdown, type TooltipProps } from 'antd';
import { SortAscendingOutlined, FileAddOutlined, ShrinkOutlined, SettingOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';

import useSort from './useSort';

const tooltipProps: TooltipProps = {
  placement: 'top',
};

export default observer(function Operations() {
  const {
    noteTree: { expandedNodes, collapseAll },
    createNote,
  } = container.resolve(NoteService);
  const { menuOptions, onClick } = useSort();

  return (
    <>
      <div>
        <Tooltip title="新建根笔记" {...tooltipProps}>
          <Button type="text" icon={<FileAddOutlined />} onClick={() => createNote()} />
        </Tooltip>
        <Dropdown trigger={['click']} menu={{ items: menuOptions.get(), onClick }} placement="bottom" arrow>
          <Tooltip title="设置排序方式" {...tooltipProps}>
            <Button type="text" icon={<SortAscendingOutlined />} />
          </Tooltip>
        </Dropdown>
        <Tooltip title="折叠全部节点" {...tooltipProps}>
          <Button disabled={expandedNodes.size === 0} type="text" icon={<ShrinkOutlined />} onClick={collapseAll} />
        </Tooltip>
      </div>
      <Tooltip title="笔记树配置" className="ml-auto" {...tooltipProps}>
        <Button type="text" icon={<SettingOutlined />} />
      </Tooltip>
    </>
  );
});
