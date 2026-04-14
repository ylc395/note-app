import { For, Show } from 'solid-js';
import clsx from 'clsx';

import StarService from '#domain/client/app/service/StarService';
import container from '#utils/singletonContainer';
import Icon from '#web/view/components/Icon';
import Workbench from '#domain/client/app/model/Workbench';
import type { StarVO } from '#domain/shared/model/star';

export default function Star(props: { onOpen: () => void }) {
  const { starList } = container.resolve(StarService);
  const { open } = container.resolve(Workbench);
  starList.refetch();

  function handleOpen(star: StarVO) {
    open({ noteId: star.entity.id, mimeType: star.entity.file?.mimeType || null });
    props.onOpen();
  }

  return (
    <div class="bg-bg-secondary shadow-2xl rounded-xl px-2 py-4 text-sm w-64 border-border-primary border">
      <h2 class="font-bold pb-2 mb-2 text-base pl-2 border-b border-border-secondary">收藏夹</h2>
      <Show when={starList.result.data}>
        {(data) => (
          <Show when={data().length > 0} fallback={<div>暂无收藏</div>}>
            <div class="max-h-96 overflow-auto space-y-2">
              <For each={data()}>
                {(star) => (
                  <div class={clsx('flex items-center px-2 py-2', 'hover:bg-bg-hover')} onClick={[handleOpen, star]}>
                    <Icon
                      iconClassName="size-4 shrink-0 mr-1"
                      icon={star.entity.icon}
                      mimeType={star.entity.file?.mimeType}
                    />
                    <span class="overflow-hidden grow text-ellipsis whitespace-nowrap ">{star.entity.title}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        )}
      </Show>
    </div>
  );
}
