import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { ArrowLeftOutlined, ArrowRightOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Tooltip, InputNumber } from 'antd';

import MemoService from 'service/MemoService';

interface Props {
  toggle: () => void;
  isExpanded: boolean;
}

export default observer(function Operations({ toggle, isExpanded }: Props) {
  const memoService = container.resolve(MemoService);

  return (
    <div className="mt-2 flex items-center justify-between">
      <div>
        <Tooltip title={isExpanded ? '收起' : '展开'}>
          <Button type="text" icon={<EditOutlined />} onClick={toggle} />
        </Tooltip>
      </div>
      <div className="flex flex-1 items-center justify-center text-xs">
        <Button
          onClick={() => memoService.load(memoService.currentPage - 1)}
          disabled={memoService.currentPage === 1}
          size="small"
          type="text"
          icon={<ArrowLeftOutlined />}
        />
        <span className="mx-2 flex items-center justify-center">
          <InputNumber controls={false} value={memoService.currentPage} className="w-8 text-xs" size="small" /> /{' '}
          {memoService.maxPage}
        </span>
        <Button
          onClick={() => memoService.load(memoService.currentPage + 1)}
          disabled={memoService.currentPage === memoService.maxPage}
          size="small"
          type="text"
          icon={<ArrowRightOutlined />}
        />
      </div>
      <Tooltip title="视图配置">
        <Button type="text" icon={<SettingOutlined />} />
      </Tooltip>
    </div>
  );
});
