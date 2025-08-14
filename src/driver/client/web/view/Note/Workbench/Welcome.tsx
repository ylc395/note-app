import { For } from 'solid-js';
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
      <ul class="mt-16 border-t pt-6 border-border-secondary">
        <For each={notes.result.data}>
          {({ time, title, id, mimeType }) => (
            <li
              title={title}
              class="cursor-pointer flex items-center space-x-4 py-2"
              onClick={() => open({ id, mimeType })}
            >
              <div class="text-text-link w-52 overflow-hidden text-ellipsis whitespace-nowrap">{title}</div>
              <time class="text-xs text-text-tertiary">{dayjs(time).format('M月DD日')}</time>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
