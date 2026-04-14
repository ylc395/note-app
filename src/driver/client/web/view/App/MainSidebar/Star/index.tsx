import { For, Show } from 'solid-js';
import { cx } from 'class-variance-authority';
import { LoaderIcon } from 'lucide-solid';

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
    <Show when={starList.result.data} fallback={<LoaderIcon class="mx-auto" />}>
      {(data) => (
        <Show when={data().length > 0} fallback={<div>暂无收藏</div>}>
          <div class="max-h-96 overflow-auto space-y-2">
            <For each={data()}>
              {(star) => (
                <div class={cx('flex items-center px-2 py-2', 'hover:bg-bg-hover')} onClick={[handleOpen, star]}>
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
  );
}
