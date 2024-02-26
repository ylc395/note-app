import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { container } from 'tsyringe';
import { AiOutlineClose } from 'react-icons/ai';

import StarManager from '@domain/app/model/StarManager';
import Button from '@web/components/Button';

export default observer(function StarView() {
  const { filteredStars, load, reset, updateKeyword, unstar, open } = container.resolve(StarManager);

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
            <div onClick={() => open(star)}>{star.title}</div>
            <Button onClick={() => unstar(star)}>
              <AiOutlineClose />
            </Button>
          </div>
        ))}
    </div>
  );
});
