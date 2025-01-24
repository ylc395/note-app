import { createEffect, on, onCleanup, Show } from 'solid-js';
import { Loader2Icon } from 'lucide-solid';
import { debounce } from 'lodash-es';
import { Key } from '@solid-primitives/keyed';

import MemoView from '#domain/client/app/model/memo/MemoView';
import Item from './Item';

export default function MemoList({ memoView }: { memoView: MemoView }) {
  let rootRef: HTMLDivElement | undefined;

  function tryFetchNextPage(container: HTMLElement) {
    if (!memoView.canLoadMore || memoView.isLoading) {
      return;
    }

    if ((container.scrollTop + container.clientHeight) / container.scrollHeight > 0.25) {
      memoView.loadMore();
    }
  }

  const handleScroll = debounce(({ target }: Event) => {
    if (target instanceof HTMLElement) {
      tryFetchNextPage(target);
    }
  }, 500);

  onCleanup(() => {
    handleScroll.cancel();
    memoView.destroy();
  });

  createEffect(
    on(
      () => memoView.timeParams,
      () => rootRef!.scrollTo({ top: 0 }),
    ),
  );

  return (
    <div
      class="mt-4 grow min-h-0 overflow-y-auto scrollbar-stable"
      classList={{ 'h-60': memoView.isParent }}
      onScroll={handleScroll}
      ref={rootRef}
    >
      <div class="space-y-6 mx-auto">
        <Key each={memoView.children || []} by={(item) => item.id}>
          {(item) => <Item memo={item()} parent={memoView} />}
        </Key>
      </div>
      <Show when={!memoView.canLoadMore} fallback={<Loader2Icon class="mx-auto my-6" size={30} />}>
        <Show when={memoView.isRoot}>
          <div class="text-center text-gray-400 my-6">没有更多了</div>
        </Show>
      </Show>
    </div>
  );
}
