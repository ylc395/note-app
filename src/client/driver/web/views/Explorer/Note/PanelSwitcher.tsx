import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Space, Button, Tooltip, theme } from 'antd';
import { StarOutlined, ApartmentOutlined } from '@ant-design/icons';

import ViewService, { ViewTypes, NoteExplorerPanel } from 'service/ViewService';

const { useToken } = theme;

export default observer(function PanelSwitcher() {
  const { explorerPanel } = container.resolve(ViewService);
  const { token } = useToken();
  const activeStyle = {
    color: token.colorPrimaryActive,
    borderColor: token.colorPrimaryActive,
    zIndex: 2,
  };

  return (
    <Space.Compact>
      <Tooltip title="笔记树面板">
        <Button
          style={explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.Tree ? activeStyle : undefined}
          icon={<ApartmentOutlined />}
          onClick={() => (explorerPanel[ViewTypes.Notes] = NoteExplorerPanel.Tree)}
        />
      </Tooltip>
      <Tooltip title="收藏面板">
        <Button
          style={explorerPanel[ViewTypes.Notes] === NoteExplorerPanel.Star ? activeStyle : undefined}
          icon={<StarOutlined />}
          onClick={() => (explorerPanel[ViewTypes.Notes] = NoteExplorerPanel.Star)}
        />
      </Tooltip>
    </Space.Compact>
  );
});
