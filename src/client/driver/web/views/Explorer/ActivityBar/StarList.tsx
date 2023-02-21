import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useRef } from 'react';
import { Button, Empty } from 'antd';
import { CloseOutlined, FileOutlined } from '@ant-design/icons';
import { useMount, useUnmount, useClickAway } from 'ahooks';

import { EntityTypes } from 'interface/Entity';
import StarService from 'service/StarService';

const iconMap = {
  [EntityTypes.Note]: () => <FileOutlined />,
};

export default observer(function StarList({ close }: { close: () => void }) {
  const starService = container.resolve(StarService);
  const ref = useRef<HTMLDivElement>(null);

  useMount(() => starService.loadStars());
  useUnmount(() => starService.clear());
  useClickAway(() => {
    if (!starService.stars) {
      return;
    }

    close();
  }, ref);

  return (
    <div ref={ref}>
      {!starService.stars && null}
      {starService.stars?.length === 0 && <Empty description="没有任何收藏" />}
      {Number(starService.stars?.length) > 0 && (
        <ul className="list-none p-0">
          {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
          {starService.stars!.map((record) => (
            <li key={record.id} className="group">
              {iconMap[record.entityType]()}
              {record.title}
              <Button
                onClick={() => starService.removeStar(record.id)}
                type="text"
                className="group-hover:visible invisible"
                icon={<CloseOutlined />}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});