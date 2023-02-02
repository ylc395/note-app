import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Space, Button, Tooltip, theme } from 'antd';
import { ApartmentOutlined, NumberOutlined, ProfileOutlined } from '@ant-design/icons';

import ViewService, { ViewTypes, NoteExplorerPanel } from 'service/ViewService';
import { action } from 'mobx';

const { useToken } = theme;
const switcher = [
  { key: NoteExplorerPanel.Tree, title: '笔记树面板', icon: () => <ApartmentOutlined /> },
  { key: NoteExplorerPanel.Topic, title: '话题面板', icon: () => <NumberOutlined /> },
  { key: NoteExplorerPanel.Ranking, title: '排行榜面板', icon: () => <ProfileOutlined /> },
] as const;

export default observer(function PanelSwitcher() {
  const { explorerPanel } = container.resolve(ViewService);
  const { token } = useToken();
  const activeStyle = {
    color: token.colorPrimary,
    backgroundColor: token.colorPrimaryBg,
    zIndex: 2,
  };

  return (
    <Space.Compact>
      {switcher.map(({ key, title, icon }) => (
        <Tooltip title={title} key={key}>
          <Button
            style={explorerPanel[ViewTypes.Notes] === key ? activeStyle : undefined}
            icon={icon()}
            onClick={action(() => (explorerPanel[ViewTypes.Notes] = key))}
          />
        </Tooltip>
      ))}
    </Space.Compact>
  );
});