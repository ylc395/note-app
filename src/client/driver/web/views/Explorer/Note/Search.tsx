import { container } from 'tsyringe';
import type { ChangeEventHandler } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import SearchService from 'service/SearchService';
// import { Scopes } from 'model/search';
import { EntityTypes } from 'model/entity';

// eslint-disable-next-line mobx/missing-observer
export default (function Search() {
  const { search } = container.resolve(SearchService);
  const onChange: ChangeEventHandler = (e) => {
    const { value } = e.target as HTMLInputElement;
    search({ terms: [value], types: [EntityTypes.Note], created: { from: '2022-02-01' } });
  };

  return (
    <Input
      placeholder="搜索笔记"
      className="mr-2 max-w-[180px]"
      onChange={onChange}
      suffix={
        <Tooltip title="高级搜索">
          <Button size="small" type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
      }
    />
  );
});
