import { For, Show } from 'solid-js';
import StarService from '#domain/client/app/service/StarService';
import container from '#utils/singletonContainer';

export default function Star() {
  const { starList } = container.resolve(StarService);
  starList.refetch();

  return (
    <div class="bg-surface-secondary shadow-2xl rounded-xl p-inset-square-md text-sm w-48 border-border-primary border">
      <h2>收藏</h2>
      <For each={starList.result.data}>{(star) => <div>{star.entity.title}</div>}</For>
    </div>
  );
}
