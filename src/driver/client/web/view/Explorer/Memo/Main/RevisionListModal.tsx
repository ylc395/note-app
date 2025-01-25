import { Dialog } from '@ark-ui/solid/dialog';
import { createEffect, createSignal, For, onCleanup, Show, on } from 'solid-js';

import RevisionList from '#domain/client/app/model/RevisionList';
import type { EntityId } from '#domain/shared/model/entity';
import Modal from '#web/components/Modal';

export default function RevisionListModal(props: { entityId: EntityId | undefined; onClose: () => void }) {
  const [getRevisionList, setRevisionList] = createSignal<RevisionList>();

  createEffect(
    on(
      () => props.entityId,
      (entityId) => {
        if (entityId) {
          const revisionView = new RevisionList(entityId);
          setRevisionList(revisionView);

          onCleanup(() => {
            revisionView.destroy();
          });
        }
      },
    ),
  );

  return (
    <Modal open={Boolean(props.entityId)} onClose={props.onClose}>
      <Dialog.Content class="w-[600px] h-80 overflow-auto bg-white">
        <Dialog.Title>历史记录</Dialog.Title>
        <Show when={getRevisionList()?.data.result.data}>
          {(revisions) => (
            <div>
              <For each={revisions()}>{(revision) => <div>{JSON.stringify(revision.bodyDiff)}</div>}</For>
            </div>
          )}
        </Show>
        <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
      </Dialog.Content>
    </Modal>
  );
}
