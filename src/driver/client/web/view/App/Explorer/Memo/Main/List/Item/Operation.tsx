import { AtSignIcon, ReplyIcon } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import { useContext } from './context';

export default function Operation() {
  const memo = createMemo(() => useContext()!.memo);
  const buttonClassName = 'flex justify-center items-center text-sm text-fg-tertiary';

  return (
    <Tabs.List class="flex space-x-4 text-sm xl:mt-4">
      <Show when={memo().isParent}>
        <Tabs.Trigger disabled={memo().value.followupsCount === 0} value="followup" class={buttonClassName}>
          <ReplyIcon class="mr-1" />
          后续
          <span class="number-suffix">{memo().value.followupsCount}</span>
        </Tabs.Trigger>
      </Show>
      <Tabs.Trigger disabled={memo().value.referrersCount === 0} value="referrers" class={buttonClassName}>
        <AtSignIcon class="mr-1" />
        被提及 <span class="number-suffix">{memo().value.referrersCount}</span>
      </Tabs.Trigger>
    </Tabs.List>
  );
}
