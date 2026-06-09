import { createMemo, For, Show } from 'solid-js';
import { isEmpty as isEmptyObject } from 'lodash-es';
import { Popover } from '@ark-ui/solid';

import { useContext } from '../composables';

const sectionTitleCls =
  'text-xs font-semibold text-fg-tertiary uppercase tracking-wide px-3 pt-3 pb-1.5 sticky top-0 bg-bg-primary';
const linkItemCls = 'px-3 py-2 cursor-pointer rounded-md hover:bg-bg-hover transition-colors duration-150';
const linkTitleCls = 'text-sm font-medium text-fg-primary leading-snug truncate';
const linkSnippetCls = 'text-xs text-fg-secondary leading-relaxed mt-0.5 line-clamp-2';
const linkUrlCls = 'text-sm text-fg-link break-all leading-snug';
const placeholderCls = 'text-fg-tertiary text-sm text-center px-3 py-4';

export default function LinkList() {
  const ctx = useContext()!;
  const isEmpty = createMemo(() => ctx.editor.entity.links.isSuccess && isEmptyObject(ctx.editor.entity.links.data));

  ctx.editor.entity.links.refetch();

  return (
    <Popover.Content class="w-64">
      <Show when={ctx.editor.entity.links.isLoading}>
        <p class={placeholderCls}>加载中</p>
      </Show>
      <Show when={isEmpty()}>
        <p class={placeholderCls}>无关联内容</p>
      </Show>
      <div class="divide-bg-secondary divide-solid divide-y-2">
        <Show when={ctx.editor.entity.links.data?.end}>
          <div>
            <h3 class={sectionTitleCls}>被以下内容引用({ctx.editor.entity.links.data?.end.length})</h3>
            <For each={ctx.editor.entity.links.data?.end}>
              {(link) => (
                <div class={linkItemCls}>
                  <h4 class={linkTitleCls}>{link.sourceEntity.title}</h4>
                  <Show when={link.sourceSnippet.text}>
                    <p class={linkSnippetCls}>{link.sourceSnippet.text}</p>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={ctx.editor.entity.links.data?.start}>
          <div>
            <h3 class={sectionTitleCls}>引用了以下内容({ctx.editor.entity.links.data?.start.length})</h3>
            <For each={ctx.editor.entity.links.data?.start}>
              {(link) => (
                <div class={linkItemCls}>
                  <h4 class={linkTitleCls}>{link.targetEntity.title}</h4>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={ctx.editor.entity.links.data?.external}>
          <div>
            <h3 class={sectionTitleCls}>外部链接({ctx.editor.entity.links.data?.external.length})</h3>
            <For each={ctx.editor.entity.links.data?.external}>
              {(link) => (
                <div class={linkItemCls}>
                  <span class={linkUrlCls}>{link.url}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Popover.Content>
  );
}
