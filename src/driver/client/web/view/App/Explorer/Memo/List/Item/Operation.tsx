import { AtSignIcon, ReplyIcon } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import { Tabs as MemoTabs } from '#domain/client/app/model/memo/Memo';
import { useContext } from './context';
import Button from '#web/view/components/Button.jsx';

export default function Operation() {
  const memo = createMemo(() => useContext()!.memo);

  return (
    <Tabs.List class="flex space-x-4 text-sm xl:mt-4">
      <Show when={memo().isParent}>
        <Tabs.Trigger
          value={MemoTabs.Followup}
          asChild={(childProps) => (
            <Button {...childProps()}>
              <ReplyIcon class="mr-1" />
              后续
              <span class="number-suffix">{memo().value.followupsCount}</span>
            </Button>
          )}
        ></Tabs.Trigger>
      </Show>
      <Show when={memo().value.referrersCount > 0}>
        <Tabs.Trigger
          value={MemoTabs.Referrers}
          asChild={(childProps) => (
            <Button {...childProps()}>
              <AtSignIcon class="mr-1" />
              被提及 <span class="number-suffix">{memo().value.referrersCount}</span>
            </Button>
          )}
        ></Tabs.Trigger>
      </Show>
    </Tabs.List>
  );
}
