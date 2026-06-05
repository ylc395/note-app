import { createMemo, For, Show } from 'solid-js';
import { isEmpty as isEmptyObject } from 'lodash-es';
import { Popover } from '@ark-ui/solid';

import { useContext } from './composables';

const sectionTitleCls = 'text-xs font-semibold text-fg-tertiary uppercase tracking-wide px-3 pt-3 pb-1.5';
const linkItemCls = 'px-3 py-2 cursor-pointer rounded-md hover:bg-bg-hover transition-colors duration-150';
const linkTitleCls = 'text-sm font-medium text-fg-primary leading-snug truncate';
const linkSnippetCls = 'text-xs text-fg-secondary leading-relaxed mt-0.5 line-clamp-2';
const linkUrlCls = 'text-sm text-fg-link break-all leading-snug';
const placeholderCls = 'text-fg-tertiary text-sm text-center px-3 py-4';
const dividerCls = 'border-t border-border-secondary my-1';

export default function LinkList() {
  const ctx = useContext()!;
  const isEmpty = createMemo(() => ctx.editor.source.links.isSuccess && isEmptyObject(ctx.editor.source.links.data));

  ctx.editor.source.links.refetch();

  return (
    <Popover.Content class="w-64">
      <div class="bg-surface-raised rounded-lg shadow-lg border border-border-primary min-w-[240px] max-w-[360px] max-h-[480px] overflow-y-auto py-1">
        <Show when={ctx.editor.source.links.isLoading}>
          <p class={placeholderCls}>加载中</p>
        </Show>
        <Show when={isEmpty()}>
          <p class={placeholderCls}>无关联内容</p>
        </Show>
        <Show when={ctx.editor.source.links.data?.end}>
          <h3 class={sectionTitleCls}>被以下内容引用({ctx.editor.source.links.data?.end.length})</h3>
          <For each={ctx.editor.source.links.data?.end}>
            {(link) => (
              <div class={linkItemCls}>
                <h4 class={linkTitleCls}>{link.sourceEntity.title}</h4>
                <Show when={link.sourceSnippet.text}>
                  <p class={linkSnippetCls}>{link.sourceSnippet.text}</p>
                </Show>
              </div>
            )}
          </For>
        </Show>
        <Show when={ctx.editor.source.links.data?.start}>
          <div class={dividerCls} />
          <h3 class={sectionTitleCls}>引用了以下内容({ctx.editor.source.links.data?.start.length})</h3>
          <For each={ctx.editor.source.links.data?.start}>
            {(link) => (
              <div class={linkItemCls}>
                <h4 class={linkTitleCls}>{link.targetEntity.title}</h4>
              </div>
            )}
          </For>
        </Show>
        <Show when={ctx.editor.source.links.data?.external}>
          <div class={dividerCls} />
          <h3 class={sectionTitleCls}>外部链接({ctx.editor.source.links.data?.external.length})</h3>
          <For each={ctx.editor.source.links.data?.external}>
            {(link) => (
              <div class={linkItemCls}>
                <span class={linkUrlCls}>{link.url}</span>
              </div>
            )}
          </For>
        </Show>
      </div>
    </Popover.Content>
  );
}
