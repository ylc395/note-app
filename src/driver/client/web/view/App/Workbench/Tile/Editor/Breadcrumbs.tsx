import { For, Show } from 'solid-js';
import { BookTextIcon, ChevronRightIcon } from 'lucide-solid';

import { useContext } from './context';

export default function Breadcrumbs() {
  const itemClassName = 'text-fg-secondary flex items-center shrink-0 text-sm';
  const iconClassName = 'w-4 h-4 text-fg-secondary';
  const ctx = useContext()!;

  return (
    <Show when={ctx.editor.path.result.data && ctx.editor.value.result.data}>
      <div class="flex px-4 py-2 border-b border-border-secondary overflow-auto shrink-0">
        <div class={itemClassName}>
          <BookTextIcon class={iconClassName} />
          <ChevronRightIcon class={iconClassName} />
        </div>
        <For each={ctx.editor.path.result.data}>
          {(path) => (
            <div class={itemClassName}>
              {path.title}
              <ChevronRightIcon class={iconClassName} />
            </div>
          )}
        </For>
        <div class={`${itemClassName} italic`}>此笔记</div>
      </div>
    </Show>
  );
}
