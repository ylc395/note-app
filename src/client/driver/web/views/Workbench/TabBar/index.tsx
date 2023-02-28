import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tabs as AntdTabs, ConfigProvider, Button, Tooltip } from 'antd';
import { SplitCellsOutlined } from '@ant-design/icons';

import EditorService from 'service/EditorService';
import type Tile from 'model/workbench/Tile';
import { TileDirections } from 'model/workbench/TileManger';

import TabItem from './TabItem';

export default observer(function TabBar({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager, openEntity } = container.resolve(EditorService);
  const { switchToEditor, closeEditor, currentEditor, editors } = tileManager.get(tileId);

  if (!currentEditor) {
    return null;
  }

  const entity = {
    entityId: currentEditor.entityId,
    entityType: currentEditor.entityType,
  };

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
          <>
            <Tooltip title="向下开辟新窗口">
              <Button
                onClick={() => openEntity(entity, { from: tileId, direction: TileDirections.Vertical })}
                className="mr-2"
                type="text"
                icon={<SplitCellsOutlined />}
              />
            </Tooltip>
            <Tooltip title="向右开辟新窗口">
              <Button
                onClick={() => openEntity(entity, { from: tileId, direction: TileDirections.Vertical })}
                type="text"
                icon={<SplitCellsOutlined />}
              />
            </Tooltip>
          </>
        }
      />
    </ConfigProvider>
  );
});
