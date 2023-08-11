import { Button, Input, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

// eslint-disable-next-line mobx/missing-observer
export default function Search() {
  return (
    <Input
      placeholder="搜索碎片"
      className="max-w-[180px]"
      suffix={
        <Tooltip title="高级搜索">
          <Button size="small" type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
      }
    />
  );
}
