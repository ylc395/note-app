import { Show, createEffect, createSignal, onCleanup } from 'solid-js';

import Modal from '#web/view/components/Modal';
import RevisionList from '#domain/client/app/model/RevisionList';
import type { EntityId } from '#domain/shared/model/entity';

import List from './List';
import TextView from './TextView';
import { useContext } from '../../composables';

export default function RevisionModal(props: { open: boolean; onClose: () => void; entityId: EntityId }) {
  const ctx = useContext()!;
  const [revisionList, setRevisionList] = createSignal<RevisionList>();

  createEffect(() => {
    if (props.open && !revisionList()) {
      setRevisionList(new RevisionList(props.entityId));
    } else if (!props.open && revisionList()) {
      revisionList()!.destroy();
      setRevisionList(undefined);
    }
  });

  onCleanup(() => {
    revisionList()?.destroy();
  });

  return (
    <Modal open={props.open} onClose={props.onClose} title={`${ctx.editor.entity.title} - 编辑历史`} cancelText={null}>
      <Show when={revisionList()?.data.result.data?.toReversed()}>
        {(revisions) => (
          <div class="flex h-80 overflow-auto">
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
