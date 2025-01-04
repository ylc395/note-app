import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { container } from '#domain/shared/infra/singletons';
import { XIcon } from 'lucide-react';

import StarManager from '#domain/client/app/model/StarManager';
import Workbench from '#domain/client/app/model/Workbench';
import Button from '#web/components/Button';

export default observer(function StarView() {
  const { filteredStars, load, reset, updateKeyword, unstar } = container.resolve(StarManager);
  const { openEntity } = container.resolve(Workbench);

  useEffect(() => {
    load();
    return reset;
  }, [load, reset]);

  return (
    <div className="bg-layout border border-solid border-layout shadow-2xl py-2 pl-4 pr-1 rounded-lg select-none">
      <h1 className="mx-0 my-2 text-base">收藏</h1>
      <input className="mb-2" onChange={(e) => updateKeyword(e.target.value)} />
      {Object.values(filteredStars)
        .flat()
        .map((star) => (
          <div key={star.entity.id} className="flex items-center justify-between group mb-1 w-60">
            <div
              onClick={() => openEntity({ entityType: star.entity.type, entityId: star.entity.id })}
              className="text-sm cursor-pointer text-ellipsis overflow-clip whitespace-nowrap"
            >
              {star.entity.title}
            </div>
            <Button
              className="group-hover:visible invisible"
              size="small"
              icon={<XIcon />}
              onClick={() => unstar(star.entity.id)}
            />
          </div>
        ))}
    </div>
  );
});
