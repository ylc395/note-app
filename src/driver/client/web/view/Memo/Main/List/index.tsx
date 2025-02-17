import { createEffect, on, onCleanup, Show } from 'solid-js';
import { Loader2Icon } from 'lucide-solid';
import { debounce } from 'lodash-es';
import { Key } from '@solid-primitives/keyed';

import MemoList from '#domain/client/app/model/memo/List';
import Item from './Item';
import { container } from '#domain/shared/infra/singletons';

export default function MemoListView() {
  let rootRef: HTMLDivElement | undefined;
  const memoList = container.resolve(MemoList);

  function tryFetchNextPage(container: HTMLElement) {
    if (!memoList.childrenQuery.result.hasNextPage || memoList.childrenQuery.result.isLoading) {
      return;
    }

    if ((container.scrollTop + container.clientHeight) / container.scrollHeight > 0.75) {
      memoList.childrenQuery.result.fetchNextPage();
    }
  }

  const handleScroll = debounce(({ target }: Event) => {
    if (target instanceof HTMLElement) {
      tryFetchNextPage(target);
    }
  }, 500);

  onCleanup(() => {
    handleScroll.cancel();
    memoList.destroy();
  });

  createEffect(
    on(
      () => memoList.filter.params,
      () => rootRef!.scrollTo({ top: 0 }),
    ),
  );

  return (
    <div class="mt-4 grow min-h-0 overflow-y-auto scrollbar-stable" onScroll={handleScroll} ref={rootRef}>
      <div class="space-y-6 mx-auto w-full">
        <Key each={memoList.childrenQuery.result.data?.pages.flat()} by="id">
          {(item) => <Item memo={item()} parent={memoList} />}
        </Key>
      </div>
      <Show
        when={!memoList.childrenQuery?.result.hasNextPage}
        fallback={<Loader2Icon class="animate-spin mx-auto my-6" size={30} />}
      >
        <div class="text-center text-gray-400 my-6">没有更多了</div>
      </Show>
    </div>
  );
}
