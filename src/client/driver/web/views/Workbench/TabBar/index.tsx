import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tabs as AntdTabs, ConfigProvider, Button, Tooltip } from 'antd';
import { SplitCellsOutlined } from '@ant-design/icons';

import EditorService from 'service/EditorService';
import type Tile from 'model/workbench/Tile';
import { TileDirections } from 'model/workbench/TileManger';

import TabItem from './TabItem';

export default observer(function TabBar({ id }: { id: Tile['id'] }) {
  const { tileManager, duplicateOnNewTile: duplicateOnNewWindow } = container.resolve(EditorService);
  const tile = tileManager.get(id);
  const { switchToTab, closeTab, currentTab } = tile;

  return (
    <ConfigProvider theme={{ components: { Tabs: { margin: 0 } } }}>
      <AntdTabs
        type="editable-card"
        className="w-full bg-gray-100"
        hideAdd
        onChange={switchToTab}
        onEdit={(key) => typeof key === 'string' && closeTab(key)}
        items={tile.tabs.map((tab) => ({ label: tab.title, key: tab.id }))}
        activeKey={currentTab?.id}
        renderTabBar={(tabBarProps, DefaultTabBar) => (
          <DefaultTabBar {...tabBarProps}>{(node) => <TabItem>{node}</TabItem>}</DefaultTabBar>
        )}
        tabBarExtraContent={
          tile.currentTab && (
            <>
              <Tooltip title="向下开辟新窗口">
                <Button
                  onClick={() => duplicateOnNewWindow(id, TileDirections.Vertical)}
                  className="mr-2"
                  type="text"
                  icon={<SplitCellsOutlined />}
                />
              </Tooltip>
              <Tooltip title="向右开辟新窗口">
                <Button
                  onClick={() => duplicateOnNewWindow(id, TileDirections.Horizontal)}
                  type="text"
                  icon={<SplitCellsOutlined />}
                />
              </Tooltip>
            </>
          )
        }
      />
    </ConfigProvider>
  );
});
