import { Dialog } from '@ark-ui/solid/dialog';
import { Show, createMemo } from 'solid-js';
import { action } from 'mobx';

import Modal from '#web/components/Modal';

import List from './List';
import TextView from './TextView';
import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function RevisionModal({ memoView }: { memoView: MemoView }) {
  const revisionList = createMemo(() => memoView.revisionList);

  function onClose() {
    memoView.toggleRevisionList();
  }

  return (
    <Modal open={Boolean(revisionList())} onClose={action(onClose)}>
      <Dialog.Content class="w-[600px] h-80 overflow-auto bg-white">
        <Dialog.Title>历史记录</Dialog.Title>
        <Show when={revisionList()?.data.result.data?.toReversed()}>
          {(revisions) => (
            <div class="flex">
              <List
                revisions={revisions()}
                onSelect={(id) => revisionList()?.setCurrentRevisionId(id)}
                selectedId={revisionList()?.currentRevisionId}
              />
              <Show when={revisionList()?.currentVersion}>{(version) => <TextView version={version()} />}</Show>
            </div>
          )}
        </Show>
        <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
      </Dialog.Content>
    </Modal>
  );
}
