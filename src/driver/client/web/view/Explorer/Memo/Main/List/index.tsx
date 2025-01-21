import { createEffect, For, on, onCleanup, Show } from 'solid-js';
import { Loader2Icon } from 'lucide-solid';
import { debounce } from 'lodash-es';

import MemoView from '#domain/client/app/model/memo/MemoView';
import Item from './Item';

export default function MemoList({ node }: { node: MemoView }) {
  let rootRef: HTMLDivElement | undefined;

  function tryFetchNextPage(container: HTMLElement) {
    if (!node.canLoadMore) {
      return;
    }

    const bottom = container.scrollHeight - (container.scrollTop + container.clientHeight);

    if (bottom <= 50) {
      node.loadMore();
    }
  }

  const handleScroll = debounce(({ target }: Event) => {
    if (target instanceof HTMLElement) {
      tryFetchNextPage(target);
    }
  }, 500);

  onCleanup(() => {
    handleScroll.cancel();
    node.destroy();
  });

  createEffect(
    on(
      () => node.timeParams,
      () => rootRef!.scrollTo({ top: 0 }),
    ),
  );

  return (
    // 值得注意：设置一个方向的 overflow 为 hidden 或 auto，则另一个方向的 overflow 会被强制设置为 auto
    // 这会导致水平方向上超出该容器的内容（例如各种悬浮的 tooltip）均被强制 clip
    <div class="mt-4 grow min-h-0 overflow-y-auto scrollbar-stable" onScroll={handleScroll} ref={rootRef}>
      <div class="space-y-6 mx-auto">
        <For each={node.children || []}>{(item) => <Item node={item} />}</For>
      </div>
      <Show when={!node.canLoadMore} fallback={<Loader2Icon class="mx-auto my-6" size={30} />}>
        <div class="text-center text-gray-400 my-6">没有更多了</div>
      </Show>
    </div>
  );
}
