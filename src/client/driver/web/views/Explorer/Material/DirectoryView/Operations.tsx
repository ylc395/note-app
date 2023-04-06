import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tooltip, Button } from 'antd';
import { SettingOutlined, FolderAddOutlined, SortAscendingOutlined, ShrinkOutlined } from '@ant-design/icons';
import MaterialService from 'service/MaterialService';

export default observer(function Operations() {
  const materialService = container.resolve(MaterialService);

  return (
    <div className="mt-2 flex justify-between">
      <div>
        <Tooltip title="新建根目录">
          <Button type="text" onClick={() => materialService.createDirectory()} icon={<FolderAddOutlined />} />
        </Tooltip>
        <Tooltip title="设置排序方式">
          <Button type="text" icon={<SortAscendingOutlined />} />
        </Tooltip>
        <Tooltip title="折叠全部节点">
          <Button type="text" icon={<ShrinkOutlined />} />
        </Tooltip>
      </div>
      <Tooltip title="视图配置" className="ml-auto">
        <Button type="text" icon={<SettingOutlined />} />
      </Tooltip>
    </div>
  );
});
