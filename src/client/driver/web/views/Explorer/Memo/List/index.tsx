import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect, useRef } from 'react';
import { useEventListener } from 'ahooks';

import MemoService from '@domain/app/service/MemoService';
import ListItem from './Item';

export default observer(function List() {
  const { explorer } = container.resolve(MemoService);
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (explorer.memos.length > 0 && divRef.current && divRef.current.scrollTop === 0) {
      divRef.current.scrollTo(0, explorer.uiState.scrollTop || 0);
    }
  });

  useEventListener(
    'scroll',
    () => {
      if (!divRef.current) return;

      const { scrollTop, clientHeight, scrollHeight } = divRef.current;

      if (scrollHeight - (clientHeight + scrollTop) < 10) {
        explorer.load('before');
      }

      explorer.updateUIState({ scrollTop });
    },
    { target: divRef },
  );

  return (
    <div ref={divRef} className="min-h-0 grow overflow-auto">
      {explorer.memos.map(({ id }) => (
        <ListItem id={id} key={id} />
      ))}
      {explorer.isEnd.before && <div>没有了</div>}
    </div>
  );
});
