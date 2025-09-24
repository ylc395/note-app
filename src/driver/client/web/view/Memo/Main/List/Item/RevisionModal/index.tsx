import { Show, createMemo } from 'solid-js';
import { action } from 'mobx';

import Modal from '#web/components/common/Modal';

import List from './List';
import TextView from './TextView';
import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function RevisionModal({ memoView }: { memoView: MemoView }) {
  const revisionList = createMemo(() => memoView.revisionList);

  function onClose() {
    memoView.toggleRevisionList();
  }

  return (
    <Modal open={Boolean(revisionList())} onClose={action(onClose)} title="历史记录">
      <Show when={revisionList()?.data.result.data?.toReversed()}>
        {(revisions) => (
          <div class="flex h-80 w-[600px] overflow-auto">
            <List
              revisions={revisions()}
              onSelect={(id) => revisionList()?.setCurrentRevisionId(id)}
              selectedId={revisionList()?.currentRevisionId}
            />
            <Show when={revisionList()?.currentVersion}>{(version) => <TextView version={version()} />}</Show>
          </div>
        )}
      </Show>
    </Modal>
  );
}
