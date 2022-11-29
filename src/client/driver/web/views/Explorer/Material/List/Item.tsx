import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { container } from 'tsyringe';
import dayjs from 'dayjs';
import { Tag } from 'antd';

import WorkbenchService from 'service/WorkbenchService';
import type { MaterialVO } from 'interface/Material';
import Icon from './Icon';

export default observer(function Item({ material }: { material: MaterialVO }) {
  const { open } = container.resolve(WorkbenchService);
  const handleClick = useCallback(() => open(material, false), [material]);

  return (
    <div className="overflow-x-hidden border-b py-2 px-2" onClick={handleClick}>
      <div className="w-full flex items-center mb-2 overflow-x-hidden">
        <span className="mr-1 text-blue-400">
          <Icon material={material} />
        </span>
        <span className="whitespace-nowrap">{material.name}</span>
      </div>
      <div className="mb-2">
        {material.tags.map((tag) => (
          <Tag key={tag.id}>{tag.name}</Tag>
        ))}
      </div>
      <div className="flex flex-col text-xs">
        <time>{dayjs.unix(material.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        <time>{dayjs.unix(material.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</time>
      </div>
    </div>
  );
});
