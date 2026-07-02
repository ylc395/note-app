import { AtSignIcon, ReplyIcon } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import { Tabs as MemoTabs } from '#domain/client/app/model/memo/Memo';
import Button from '#web/view/components/Button.jsx';
import { useContext } from './context';

export default function Operation() {
  const memo = createMemo(() => useContext()!.memo);

  const triggerClass =
    'data-[selected]:bg-bg-accent-subtle data-[selected]:text-fg-accent-subtle';

  return (
    <Tabs.List class="flex gap-2 text-sm mt-3">
      <Show when={memo().isParent}>
        <Tabs.Trigger
          value={MemoTabs.Followup}
          asChild={(childProps) => (
            <Button {...childProps()} size="small" class={triggerClass}>
              <ReplyIcon />
              后续
              <span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-bg-tertiary text-xs tabular-nums text-fg-secondary">
                {memo().value.followupsCount}
              </span>
            </Button>
          )}
        ></Tabs.Trigger>
      </Show>
      <Show when={memo().value.referrersCount > 0}>
        <Tabs.Trigger
          value={MemoTabs.Referrers}
          asChild={(childProps) => (
            <Button {...childProps()} size="small" class={triggerClass}>
              <AtSignIcon />
              被提及
              <span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-bg-tertiary text-xs tabular-nums text-fg-secondary">
                {memo().value.referrersCount}
              </span>
            </Button>
          )}
        ></Tabs.Trigger>
      </Show>
    </Tabs.List>
  );
}
