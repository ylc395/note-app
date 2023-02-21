import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tooltip, Button, Popover, type ButtonProps } from 'antd';
import { BuildOutlined, BookOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useToggle, useMemoizedFn } from 'ahooks';

import ViewService, { ViewTypes } from 'service/ViewService';
import StarList from './StarList';

const VIEW_ITEMS = [
  { key: ViewTypes.Materials, icon: <BuildOutlined />, label: '素材库' },
  { key: ViewTypes.Notes, icon: <BookOutlined />, label: '笔记本' },
];

const BUTTON_PROPS: ButtonProps = {
  type: 'text',
  size: 'large',
  block: true,
};

export default observer(function ActivityBar() {
  const { currentView, setCurrentView } = container.resolve(ViewService);
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

  return (
    <nav className="w-14 h-screen bg-gray-50">
      <ul className="list-none p-0 text-center">
        {VIEW_ITEMS.map(({ key, icon, label }) => (
          <li key={key}>
            <Tooltip title={label} placement="right">
              <Button
                {...BUTTON_PROPS}
                className={currentView === key ? 'text-blue-600' : ''}
                onClick={() => setCurrentView(key)}
                icon={icon}
              />
            </Tooltip>
          </li>
        ))}
        <li>
          <Popover destroyTooltipOnHide placement="right" open={isStarVisible} content={<StarList close={closeStar} />}>
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
    </nav>
  );
});
