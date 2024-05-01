import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { container } from 'tsyringe';
import { AiOutlineClose } from 'react-icons/ai';

import StarManager from '@domain/client/app/model/StarManager';
import { Workbench } from '@domain/client/app/model/workbench';
import Button from '@web/components/Button';

export default observer(function StarView() {
  const { filteredStars, load, reset, updateKeyword, unstar } = container.resolve(StarManager);
  const { openEntity } = container.resolve(Workbench);

  useEffect(() => {
    load();
    return reset;
  }, [load, reset]);

  return (
    <div className="bg-white">
      <input onChange={(e) => updateKeyword(e.target.value)} />
      {Object.values(filteredStars)
        .flat()
        .map((star) => (
          <div key={star.entityId}>
            <div onClick={() => openEntity(star)}>{star.title}</div>
            <Button onClick={() => unstar(star.entityId)}>
              <AiOutlineClose />
            </Button>
          </div>
        ))}
    </div>
  );
});
