import { createMemo, For } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import { Tabs as MemoTabs } from '#domain/client/app/model/memo/Memo';
import { useContext } from './context';

export default function ReferrerList() {
  const memo = createMemo(() => useContext()!.memo);

  return (
    <Tabs.Content value={MemoTabs.Referrers}>
      <div>
        <For each={memo().referrersQuery.result.data}>{(referrer) => <div>{referrer.sourceSnippet.text}</div>}</For>
      </div>
    </Tabs.Content>
  );
}
