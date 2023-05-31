import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect, useRef } from 'react';
import { Button, Empty } from 'antd';
import { CloseOutlined, FileOutlined, LoadingOutlined, BuildOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useClickAway } from 'ahooks';

import { EntityTypes } from 'interface/entity';
import StarService from 'service/StarService';

const iconMap = {
  [EntityTypes.Note]: () => <FileOutlined />,
  [EntityTypes.Memo]: () => <BuildOutlined />,
  [EntityTypes.Material]: () => <DatabaseOutlined />,
};

export default observer(function StarList({ close }: { close: () => void }) {
  const starService = container.resolve(StarService);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    starService.loadStars();
    return () => starService.clear();
  }, [starService]);

  useClickAway(() => {
    if (!starService.stars) {
      return;
    }

    close();
  }, ref);

  return (
    <div ref={ref} className="w-72">
      {!starService.stars && (
        <div className="text-center">
          <LoadingOutlined />
        </div>
      )}
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
                className="invisible group-hover:visible"
                icon={<CloseOutlined />}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
