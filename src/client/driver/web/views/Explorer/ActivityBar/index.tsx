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
  CodeOutlined,
  ClusterOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useToggle, useMemoizedFn } from 'ahooks';

import ViewService, { ExplorerTypes } from 'service/ViewService';
import StarList from './StarList';

interface ExplorerButton {
  key: ExplorerTypes;
  icon: ReactNode;
  label: string;
}

const FIRST_CLASS_EXPLORER_ITEMS: ExplorerButton[] = [
  { key: ExplorerTypes.Materials, icon: <DatabaseOutlined />, label: '素材库' },
  { key: ExplorerTypes.Notes, icon: <BookOutlined />, label: '笔记本' },
  { key: ExplorerTypes.Timeline, icon: <BuildOutlined />, label: '随想' },
  { key: ExplorerTypes.Code, icon: <CodeOutlined />, label: '代码片段' },
  { key: ExplorerTypes.Todo, icon: <CheckSquareOutlined />, label: '任务' },
];

const BUTTON_PROPS: ButtonProps = {
  type: 'text',
  size: 'large',
  block: true,
};

export default observer(function ActivityBar() {
  const { currentExplorer, setExplorer } = container.resolve(ViewService);
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
    <nav className="w-14 h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <ul className="list-none p-0 text-center m-0">
          {FIRST_CLASS_EXPLORER_ITEMS.map((item) => (
            <li key={item.key}>{getExplorerButton(item)}</li>
          ))}
        </ul>
        <ul className="list-none p-0 m-0 mt-3 pt-3 text-center border-t border-gray-300 border-solid border-0">
          <li>{getExplorerButton({ icon: <NumberOutlined />, label: '话题', key: ExplorerTypes.Topic })} </li>
          <li>{getExplorerButton({ icon: <ClusterOutlined />, label: '关系图', key: ExplorerTypes.Graph })} </li>
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
        </ul>
      </div>
      <ul className="list-none p-0 text-center pb-2">
        <li>{getExplorerButton({ label: '回收站', key: ExplorerTypes.Dustbin, icon: <DeleteOutlined /> })} </li>
      </ul>
    </nav>
  );
});
