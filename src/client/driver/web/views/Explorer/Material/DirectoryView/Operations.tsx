import { observer } from 'mobx-react-lite';
import { Tooltip, Button } from 'antd';
import { FileAddOutlined, SettingOutlined, FolderAddOutlined } from '@ant-design/icons';

export default observer(function Operations() {
  return (
    <div className="mt-2 flex justify-between">
      <div>
        <Tooltip title="新建根目录">
          <Button type="text" icon={<FolderAddOutlined />} />
        </Tooltip>
        <Tooltip title="上传素材">
          <Button type="text" icon={<FileAddOutlined />} />
        </Tooltip>
      </div>
      <Tooltip title="视图配置" className="ml-auto">
        <Button type="text" icon={<SettingOutlined />} />
      </Tooltip>
    </div>
  );
});
