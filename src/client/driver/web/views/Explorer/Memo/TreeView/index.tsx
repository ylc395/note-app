import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect } from 'react';

import MemoService from '@domain/app/service/MemoService';
import Item from './Item';

export default observer(() => {
  const memoService = container.resolve(MemoService);

  useEffect(() => {
    memoService.load();
    return () => memoService.reset();
  }, [memoService]);

  return (
    <div className="h-full">
      {memoService.memos.map((memo) => (
        <Item memo={memo} key={memo.id} />
      ))}
    </div>
  );
});
