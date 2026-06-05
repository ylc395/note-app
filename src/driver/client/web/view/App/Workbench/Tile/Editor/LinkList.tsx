import { createMemo, For, Show } from 'solid-js';
import { isEmpty as isEmptyObject } from 'lodash-es';
import { Popover } from '@ark-ui/solid';

import { useContext } from './composables';

export default function LinkList() {
  const ctx = useContext()!;
  const isEmpty = createMemo(() => ctx.editor.source.links.isSuccess && isEmptyObject(ctx.editor.source.links));

  ctx.editor.source.links.refetch();

  return (
    <Popover.Content class="z-10!">
      <Show when={ctx.editor.source.links.isLoading}>
        <p>加载中</p>
      </Show>
      <Show when={isEmpty()}>
        <p>无关联内容</p>
      </Show>
      <Show when={ctx.editor.source.links.data?.end}>
        <h3>被以下内容引用</h3>
        <For each={ctx.editor.source.links.data?.end}>{(link) => <div>{link.sourceEntity.title}</div>}</For>
      </Show>
      <Show when={ctx.editor.source.links.data?.start}>
        <h3>引用了以下内容</h3>
        <For each={ctx.editor.source.links.data?.start}>{(link) => <div>{link.sourceEntity.title}</div>}</For>
      </Show>
      <Show when={ctx.editor.source.links.data?.external}>
        <h3>外部链接</h3>
        <For each={ctx.editor.source.links.data?.external}>{(link) => <div>{link.url}</div>}</For>
      </Show>
    </Popover.Content>
  );
}
