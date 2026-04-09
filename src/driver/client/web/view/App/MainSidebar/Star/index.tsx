import { For, Show } from 'solid-js';
import StarService from '#domain/client/app/service/StarService';
import container from '#utils/singletonContainer';

export default function Star() {
  const { starList } = container.resolve(StarService);
  starList.refetch();

  return (
    <div class="bg-bg-secondary shadow-2xl rounded-xl p-2 text-sm w-48 border-border-primary border">
      <h2 class="font-bold mb-2">收藏夹</h2>
      <Show when={starList.result.data}>
        {(data) => (
          <Show when={data().length > 0} fallback={<div>暂无收藏</div>}>
            <div class="max-h-48 overflow-auto space-y-2">
              <For each={data()}>
                {(star) => <div class="overflow-hidden text-ellipsis whitespace-nowrap">{star.entity.title}</div>}
              </For>
            </div>
          </Show>
        )}
      </Show>
    </div>
  );
}
