import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Input, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import SearchService from 'service/SearchService';
import { ChangeEventHandler, useCallback } from 'react';
import { Scopes, Types } from 'interface/search';

export default observer(function Search() {
  const { search } = container.resolve(SearchService);
  const onChange: ChangeEventHandler = useCallback(
    (e) => {
      const { value } = e.target as HTMLInputElement;
      search({ terms: [value], types: [Types.Note] });
    },
    [search],
  );

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
