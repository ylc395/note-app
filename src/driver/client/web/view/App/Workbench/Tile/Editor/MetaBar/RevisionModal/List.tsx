import { createSignal, For } from 'solid-js';
import dayjs from 'dayjs';
import { cx } from 'class-variance-authority';
import { action } from 'mobx';

import Button from '#web/view/components/Button';
import type RevisionList from '#domain/client/app/model/RevisionList';
import type { RevisionVO } from '#domain/shared/model/revision';
import { Tooltip } from '@ark-ui/solid';

export default function List(props: { revisionList: RevisionList }) {
  const [isDiffing, setIsDiffing] = createSignal(false);

  function handleClick(id: RevisionVO['id']) {
    if (isDiffing()) {
      const canDiff = props.revisionList.diff(id);

      if (canDiff) {
        setIsDiffing(false);
      }
    } else {
      props.revisionList.clearChanges();
      props.revisionList.setCurrentRevisionId(id);
    }
  }

  return (
    <div class="mr-4 w-48 shrink-0 overflow-auto flex flex-col justify-between">
      <div class="overflow-auto space-y-2">
        <For each={props.revisionList.data.data?.toReversed()}>
          {(revision) => (
            <div
              class={cx(
                'cursor-pointer rounded px-2 py-1 text-sm',
                revision.id === props.revisionList.currentRevisionId ||
                  props.revisionList.changes?.newRevision.id === revision.id ||
                  props.revisionList.changes?.oldRevision.id === revision.id
                  ? 'bg-bg-active'
                  : 'hover:bg-bg-hover',
              )}
              onClick={action(() => handleClick(revision.id))}
            >
              {dayjs(revision.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          )}
        </For>
      </div>
      <div>
        <Tooltip.Root open={isDiffing()} positioning={{ placement: 'top-start' }}>
          <Tooltip.Trigger
            asChild={(props) => (
              <Button selected={isDiffing()} {...props()} onClick={() => setIsDiffing(!isDiffing())}>
                对比
              </Button>
            )}
          />
          <Tooltip.Positioner class="absolute z-10!">
            <Tooltip.Content>选择一个版本，与当前选中版本进行对比</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </div>
    </div>
  );
}
