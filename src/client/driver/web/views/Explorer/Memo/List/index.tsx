import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect } from 'react';

import MemoService from 'service/MemoService';
import Item from './Item';

export default observer(() => {
  const memoService = container.resolve(MemoService);

  useEffect(() => {
    memoService.load();
  }, [memoService]);

  return (
    <div className="scrollbar-hidden overflow-auto bg-gray-50 px-2 pt-6">
      {memoService.memos.map((memo) => (
        <Item memo={memo} key={memo.id} />
      ))}
    </div>
  );
});
