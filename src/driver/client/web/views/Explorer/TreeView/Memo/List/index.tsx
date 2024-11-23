import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect, useRef } from 'react';
import { useEventListener } from 'ahooks';

import ListItem from './Item';
import ListView from '#domain/client/app/model/memo/ListView';
import assert from 'assert';

export default observer(function List() {
  const { root, uiState, updateUIState } = container.resolve(ListView);
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (root.sortedChildren.length > 0 && divRef.current && divRef.current.scrollTop === 0) {
      divRef.current.scrollTo(0, uiState.scrollTop || 0);
    }
  });

  useEventListener(
    'scroll',
    () => {
      if (!divRef.current) return;

      const { scrollTop, clientHeight, scrollHeight } = divRef.current;

      if (scrollHeight - (clientHeight + scrollTop) < 10) {
        root.load('down');
      }

      updateUIState({ scrollTop });
    },
    { target: divRef },
  );

  return (
    <div className="grow scroll-zone">
      <div ref={divRef} className="px-3">
        {root.sortedChildren.map((memoTreeNode) => {
          assert(memoTreeNode.memo);
          return <ListItem key={memoTreeNode.memo.id} node={memoTreeNode} />;
        })}
        {root.isLoaded.down && <div className="text-sm text-center text-text-secondary mb-2 opacity-40">没有了</div>}
      </div>
    </div>
  );
});
