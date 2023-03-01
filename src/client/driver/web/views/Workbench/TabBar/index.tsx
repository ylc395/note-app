import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tabs as AntdTabs, ConfigProvider, Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import EditorService from 'service/EditorService';
import type Tile from 'model/workbench/Tile';

import TabItem from './TabItem';

export default observer(function TabBar({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager } = container.resolve(EditorService);
  const { switchToEditor, closeEditor, currentEditor, editors, closeAllEditors } = tileManager.get(tileId);

  if (!currentEditor) {
    return null;
  }

  return (
    <ConfigProvider theme={{ components: { Tabs: { margin: 0 } } }}>
      <AntdTabs
        type="editable-card"
        className="w-full bg-gray-100"
        hideAdd
        onChange={switchToEditor}
        onEdit={(key) => typeof key === 'string' && closeEditor(key)}
        items={editors.map((tab) => ({ label: tab.title, key: tab.id }))}
        activeKey={currentEditor.id}
        renderTabBar={(tabBarProps, DefaultTabBar) => (
          <DefaultTabBar {...tabBarProps}>{(node) => <TabItem>{node}</TabItem>}</DefaultTabBar>
        )}
        tabBarExtraContent={
          <Tooltip title="关闭全部">
            <Button onClick={closeAllEditors} type="text" icon={<CloseOutlined />} />
          </Tooltip>
        }
      />
    </ConfigProvider>
  );
});
