import { createMemo, For } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import { Tabs as MemoTabs } from '#domain/client/app/model/memo/Memo';
import { useContext } from './context';

export default function ReferrerList() {
  const memo = createMemo(() => useContext()!.memo);

  return (
    <Tabs.Content class="mt-3 space-y-2" value={MemoTabs.Referrers}>
      <For each={memo().referrersQuery.result.data}>
        {(referrer) => (
          <blockquote class="border-l-2 border-border-accent-subtle bg-surface-sunken rounded-r-md px-3 py-2 text-sm text-fg-secondary leading-relaxed">
            {referrer.sourceSnippet.text}
          </blockquote>
        )}
      </For>
    </Tabs.Content>
  );
}
