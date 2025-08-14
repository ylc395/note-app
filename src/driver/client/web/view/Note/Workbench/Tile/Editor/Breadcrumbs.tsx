import { For, Show } from 'solid-js';
import { BookTextIcon, ChevronRightIcon } from 'lucide-solid';
import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';

export default function Breadcrumbs(props: { editor: BaseEditor }) {
  const itemClassName = 'text-text-secondary flex items-center shrink-0';
  const iconClassName = 'w-4 h-4 text-text-secondary';

  return (
    <Show when={props.editor.path.result.data && props.editor.value.result.data}>
      <div class="flex px-4 py-2 border-b border-border-secondary overflow-auto shrink-0">
        <div class={itemClassName}>
          <BookTextIcon class={iconClassName} />
          <ChevronRightIcon class={iconClassName} />
        </div>
        <For each={props.editor.path.result.data}>
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
