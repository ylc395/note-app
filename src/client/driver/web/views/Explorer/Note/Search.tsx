import { observer } from 'mobx-react-lite';
import { Input, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

export default observer(function Search() {
  return (
    <Input
      placeholder="搜索笔记"
      className="mr-2 max-w-[180px]"
      suffix={
        <Tooltip title="高级搜索">
          <Button size="small" type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
      }
    />
  );
});
