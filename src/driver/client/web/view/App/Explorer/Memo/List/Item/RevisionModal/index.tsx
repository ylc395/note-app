import { createMemo, onCleanup, Show } from 'solid-js';
import { action } from 'mobx';

import Modal from '#web/view/components/Modal';
import RevisionList from '#domain/client/app/model/RevisionList';

import List from './List';
import TextView from './TextView';
import { useContext } from '../context';

export default function RevisionModal() {
  const memo = createMemo(() => useContext()!.memo);
  const revisionList = new RevisionList(memo().value.id);

  function onClose() {
    memo().uiState.revision = false;
  }

  onCleanup(() => {
    revisionList.destroy();
  });

  return (
    <Modal open={Boolean(memo().uiState.revision)} onClose={action(onClose)} title="历史记录">
      <Show when={revisionList.data.data?.toReversed()}>
        {(revisions) => (
          <div class="flex h-80 w-[640px] border border-border-primary rounded-lg overflow-hidden bg-bg-primary">
            <List
              revisions={revisions()}
              onSelect={(id) => revisionList.setCurrentRevisionId(id)}
              selectedId={revisionList.currentRevisionId}
            />
            <Show when={revisionList.currentVersion}>{(version) => <TextView version={version()} />}</Show>
          </div>
        )}
      </Show>
    </Modal>
  );
}
