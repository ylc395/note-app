import { For, Show } from 'solid-js';

import MemoList from '#domain/client/app/model/memo/List';
import { container } from '#domain/shared/infra/singletons';
import { Splitter } from '@ark-ui/solid';

export default function LinkFilter() {
  const {
    filter: { linkSelector },
  } = container.resolve(MemoList);

  const { linkSetQuery, update } = linkSelector;

  return (
    <Show when={linkSelector.hasContent}>
      <Splitter.Panel id="linkSelector" class="min-h-8 flex flex-col">
        <h3>内容包含</h3>
        <div class="overflow-auto">
          <Show when={linkSetQuery.result.data!.entities.records.length > 0}>
            <div>
              <span>内链 {linkSetQuery.result.data!.entities.total}</span>
              <ul>
                <For each={linkSetQuery.result.data?.entities.records}>
                  {({ count, entity }) => (
                    <li onClick={() => update({ entityIds: [entity.id] })}>
                      {entity.title}
                      <span>{count}</span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
          <Show when={linkSetQuery.result.data!.domains.records.length > 0}>
            <div>
              <span>外链 {linkSetQuery.result.data!.domains.total}</span>
              <ul>
                <For each={linkSetQuery.result.data?.domains.records}>
                  {({ domain, count }) => (
                    <li class="flex justify-between" onClick={() => update({ domains: [domain] })}>
                      {domain}
                      <span>{count}</span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
          <Show when={linkSetQuery.result.data!.files.records.length > 0}>
            <div>文件 {linkSetQuery.result.data!.files.total}</div>
          </Show>
        </div>
      </Splitter.Panel>
    </Show>
  );
}
