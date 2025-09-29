import { For, Show } from 'solid-js';
import dayjs from 'dayjs';

import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';

export default function Welcome() {
  const {
    recentManager: { notes, ready },
    open,
  } = container.resolve(Workbench);
  ready(() => notes.refetch());

  return (
    <div class="w-full h-full bg-surface-secondary flex flex-col items-center justify-center">
      <p class="text-text-secondary text-2xl">在左侧边栏中打开或新建笔记</p>
      <Show when={notes.result.data && notes.result.data.length > 0}>
        <h2 class="relative flex items-center justify-center mt-16 w-52 text-text-tertiary whitespace-nowrap before:content-[''] before:flex-1 before:border-t before:border-text-tertiary before:opacity-30 before:mr-4 after:content-[''] after:flex-1 after:border-t after:border-text-tertiary after:opacity-30 after:ml-4">
          最近打开
        </h2>
        <ul class="pt-6">
          <For each={notes.result.data}>
            {({ time, title, id, mimeType }) => (
              <li
                title={title}
                class="cursor-pointer flex items-center space-x-4 py-2"
                onClick={() => open({ entityId: id, mimeType })}
              >
                <div class="text-text-link w-52 overflow-hidden text-ellipsis whitespace-nowrap">{title}</div>
                <time class="text-xs text-text-tertiary">{dayjs(time).format('M月DD日')}</time>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
