import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect } from 'react';

import MemoService from 'service/MemoService';
import Item from './Item';
import SearchInput from '../../components/TreeView/SearchInput';
import { EntityTypes } from 'model/entity';

export default observer(() => {
  const memoService = container.resolve(MemoService);

  useEffect(() => {
    memoService.load();
    return () => memoService.reset();
  }, [memoService]);

  return (
    <div className="h-full">
      <SearchInput entityType={EntityTypes.Memo} />
      {memoService.memos.map((memo) => (
        <Item memo={memo} key={memo.id} />
      ))}
    </div>
  );
});
