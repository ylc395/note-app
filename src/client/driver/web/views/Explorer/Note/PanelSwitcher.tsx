import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Space, Button, Tooltip, theme } from 'antd';
import { ApartmentOutlined, ProfileOutlined } from '@ant-design/icons';

import Layout, { ExplorerTypes, NoteExplorerPanel } from 'model/Layout';
import { action } from 'mobx';

const { useToken } = theme;
const switcher = [
  { key: NoteExplorerPanel.Tree, title: '笔记树视图', icon: () => <ApartmentOutlined /> },
  { key: NoteExplorerPanel.CustomView, title: '自定义视图', icon: () => <ProfileOutlined /> },
] as const;

export default observer(function PanelSwitcher() {
  const { explorerPanel } = container.resolve(Layout);
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
            style={explorerPanel[ExplorerTypes.Notes] === key ? activeStyle : undefined}
            icon={icon()}
            onClick={action(() => (explorerPanel[ExplorerTypes.Notes] = key))}
          />
        </Tooltip>
      ))}
    </Space.Compact>
  );
});
