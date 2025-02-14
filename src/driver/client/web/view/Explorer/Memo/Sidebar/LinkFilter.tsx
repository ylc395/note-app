import { For, Show } from 'solid-js';

import MemoList from '#domain/client/app/model/memo/List';
import { container } from '#domain/shared/infra/singletons';

export default function LinkFilter() {
  const {
    filter: { linkSetQuery },
  } = container.resolve(MemoList);

  return (
    <Show when={Object.values(linkSetQuery.result.data || {}).some(({ records }) => records.length > 0)}>
      <div>
        <h3>内容包含</h3>
        <div>
          <Show when={linkSetQuery.result.data!.entities.records.length > 0}>
            <div>
              <span>内链 {linkSetQuery.result.data!.entities.total}</span>
              <ul>
                <For each={linkSetQuery.result.data?.entities.records}>
                  {({ count, entity }) => (
                    <li>
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
                    <li class="flex justify-between">
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
      </div>
    </Show>
  );
}
