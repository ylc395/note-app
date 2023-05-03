import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import type { ReactNode } from 'react';
import { Tooltip, Button, Popover, type ButtonProps } from 'antd';
import {
  BuildOutlined,
  BookOutlined,
  StarOutlined,
  StarFilled,
  NumberOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useToggle, useMemoizedFn } from 'ahooks';

import Layout, { ExplorerTypes } from 'model/Layout';
import StarList from './StarList';

interface ExplorerButton {
  key: ExplorerTypes;
  icon: ReactNode;
  label: string;
}

const FIRST_CLASS_EXPLORER_ITEMS: ExplorerButton[] = [
  { key: ExplorerTypes.Materials, icon: <DatabaseOutlined />, label: '素材库' },
  { key: ExplorerTypes.Notes, icon: <BookOutlined />, label: '笔记本' },
  { key: ExplorerTypes.Memo, icon: <BuildOutlined />, label: '随想' },
];

const BUTTON_PROPS: ButtonProps = {
  type: 'text',
  size: 'large',
  block: true,
};

export default observer(function ActivityBar() {
  const { currentExplorer, setExplorer } = container.resolve(Layout);
  const [isStarVisible, { set: setStarVisible }] = useToggle(false);
  const [isStarTooltipVisible, { set: setStarTooltipVisible }] = useToggle(false);
  const handleStarClick = useMemoizedFn(() => {
    setStarTooltipVisible(false);
    setStarVisible(true);
  });

  const closeStar = useMemoizedFn(() => {
    setStarTooltipVisible(false);
    setStarVisible(false);
  });

  const getExplorerButton = useMemoizedFn((button: ExplorerButton) => (
    <Tooltip placement="right" title={button.label}>
      <Button
        {...BUTTON_PROPS}
        onClick={() => setExplorer(button.key)}
        className={currentExplorer === button.key ? 'text-blue-600' : ''}
        icon={button.icon}
      />
    </Tooltip>
  ));

  return (
    <nav className="flex h-screen w-14 flex-col justify-between border-0 border-r border-solid border-gray-200 bg-gray-50 text-center">
      <div>
        <ul className="m-0 p-0">
          {FIRST_CLASS_EXPLORER_ITEMS.map((item) => (
            <li key={item.key}>{getExplorerButton(item)}</li>
          ))}
        </ul>
        <ul className="m-0 my-3 border-0 border-t border-solid border-gray-300 p-0">
          <li>
            <Popover
              destroyTooltipOnHide
              placement="right"
              open={isStarVisible}
              content={<StarList close={closeStar} />}
            >
              <Tooltip
                title="收藏夹"
                placement="right"
                open={!isStarVisible && isStarTooltipVisible}
                onOpenChange={setStarTooltipVisible}
              >
                <Button
                  {...BUTTON_PROPS}
                  onClick={handleStarClick}
                  icon={isStarVisible ? <StarFilled className="text-yellow-500" /> : <StarOutlined />}
                />
              </Tooltip>
            </Popover>
          </li>
          <li>
            <Tooltip title="话题" placement="right">
              <Button {...BUTTON_PROPS} icon={<NumberOutlined />} />
            </Tooltip>
          </li>
          <li>
            <Tooltip title="搜索" placement="right">
              <Button {...BUTTON_PROPS} icon={<SearchOutlined />} />
            </Tooltip>
          </li>
        </ul>
      </div>
      <ul className="m-0 mb-1 p-0">
        <li>{getExplorerButton({ label: '回收站', key: ExplorerTypes.Dustbin, icon: <DeleteOutlined /> })} </li>
        <li>
          <Tooltip placement="right" title="设置">
            <Button {...BUTTON_PROPS} icon={<SettingOutlined />} />
          </Tooltip>
        </li>
      </ul>
    </nav>
  );
});
