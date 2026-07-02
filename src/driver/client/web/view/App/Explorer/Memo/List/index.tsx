import { createEffect, on, onCleanup, onMount, Show } from 'solid-js';
import { debounce } from 'lodash-es';
import { Key } from '@solid-primitives/keyed';
import assert from 'assert';

import Item from './Item';
import { useContext } from '../context';
import Loading from './Loading';

export default function MemoListView() {
  let rootRef: HTMLDivElement | undefined;
  const { memoList } = useContext()!;

  async function tryFetchNextPage() {
    assert(rootRef);

    if (!memoList.childrenQuery.result.hasNextPage || memoList.childrenQuery.result.isLoading) {
      return;
    }

    if ((rootRef.scrollTop + rootRef.clientHeight) / rootRef.scrollHeight > 0.75) {
      await memoList.childrenQuery.result.fetchNextPage();
    }
  }

  const handleScroll = debounce(tryFetchNextPage, 500);

  onMount(async () => {
    await memoList.childrenQuery.result.fetchNextPage();
    tryFetchNextPage();
  });

  onCleanup(() => {
    handleScroll.cancel();
  });

  createEffect(
    on(
      () => memoList.filter.params,
      () => rootRef!.scrollTo({ top: 0 }),
    ),
  );

  return (
    <div class="mt-4 min-h-0 overflow-y-auto scrollbar-stable pr-1" onScroll={handleScroll} ref={rootRef}>
      <Show when={!memoList.childrenQuery.isRefetching} fallback={<Loading />}>
        <div class="space-y-4 mx-auto w-full">
          <Key each={memoList.childrenQuery.result.data?.pages.flat()} by="id">
            {(item) => <Item memo={item()} parent={memoList} />}
          </Key>
        </div>
        <Show when={!memoList.childrenQuery?.result.hasNextPage} fallback={<Loading />}>
          <div class="text-center text-xs text-fg-tertiary my-6">没有更多了</div>
        </Show>
      </Show>
    </div>
  );
}
