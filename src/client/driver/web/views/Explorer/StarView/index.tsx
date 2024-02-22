import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { container } from 'tsyringe';

import StarManager from '@domain/app/model/StarManager';

export default observer(function StarView() {
  const { filteredStars, load, reset, updateKeyword } = container.resolve(StarManager);

  useEffect(() => {
    load();
    return reset;
  }, [load, reset]);

  return (
    <div>
      <input onChange={(e) => updateKeyword(e.target.value)} />
      {Object.values(filteredStars)
        .flat()
        .map((star) => star.title)}
    </div>
  );
});
