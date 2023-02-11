import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tooltip, Button, Dropdown } from 'antd';
import { SortAscendingOutlined, FileAddOutlined, ShrinkOutlined, SettingOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';

import useSort from './useSort';

export default observer(function Operations() {
  const {
    noteTree: { expandedNodes, collapseAll },
    createNote,
  } = container.resolve(NoteService);
  const { menuOptions, onClick } = useSort();

  return (
    <>
      <div>
        <Tooltip title="新建根笔记">
          <Button type="text" icon={<FileAddOutlined />} onClick={() => createNote()} />
        </Tooltip>
        <Dropdown menu={{ items: menuOptions.get(), onClick }} placement="bottom" arrow>
          <Button type="text" icon={<SortAscendingOutlined />} />
        </Dropdown>
        <Tooltip title="折叠全部节点">
          <Button disabled={expandedNodes.size === 0} type="text" icon={<ShrinkOutlined />} onClick={collapseAll} />
        </Tooltip>
      </div>
      <Tooltip title="笔记树配置" className="ml-auto">
        <Button type="text" icon={<SettingOutlined />} />
      </Tooltip>
    </>
  );
});
