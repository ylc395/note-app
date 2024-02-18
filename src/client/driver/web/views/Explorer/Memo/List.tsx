import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect, useRef } from 'react';
import { useEventListener } from 'ahooks';

import MemoService from '@domain/app/service/MemoService';
import ListItem from './ListItem';

export default observer(function List() {
  const { list } = container.resolve(MemoService);
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (list.memos.length > 0 && divRef.current && divRef.current.scrollTop === 0) {
      divRef.current.scrollTo(0, list.uiState.scrollTop || 0);
    }
  });

  useEventListener(
    'scroll',
    () => {
      if (!divRef.current) {
        return;
      }

      const { scrollTop, clientHeight, scrollHeight } = divRef.current;

      if (scrollHeight - (clientHeight + scrollTop) < 10) {
        list.load(true);
      }

      list.updateUIState({ scrollTop });
    },
    { target: divRef },
  );

  return (
    <div ref={divRef} className="min-h-0 grow overflow-auto">
      {list.memos.map((id) => (
        <ListItem id={id} key={id} />
      ))}
      {list.isEnd && <div>没有了</div>}
    </div>
  );
});
