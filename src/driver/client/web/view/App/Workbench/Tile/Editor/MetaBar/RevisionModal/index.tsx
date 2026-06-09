import { Show, createEffect, createSignal, onCleanup } from 'solid-js';

import Modal from '#web/view/components/Modal';
import RevisionList from '#domain/client/app/model/RevisionList';

import List from './List';
import TextView from './TextView';
import { useContext } from '../../composables';

export default function RevisionModal(props: { open: boolean; onClose: () => void }) {
  const ctx = useContext()!;
  const [revisionList, setRevisionList] = createSignal<RevisionList>();

  createEffect(() => {
    if (props.open && !revisionList()) {
      setRevisionList(new RevisionList(ctx.editor.entityId));
    } else if (!props.open && revisionList()) {
      revisionList()!.destroy();
      setRevisionList(undefined);
    }
  });

  onCleanup(() => {
    revisionList()?.destroy();
  });

  return (
    <Modal
      size="lg"
      open={props.open}
      onClose={props.onClose}
      title={`${ctx.editor.entity.title} - 版本历史`}
      bottom={null}
    >
      <div class="flex h-96">
        <Show when={revisionList()}>
          {(list) => (
            <>
              <List revisionList={list()} />
              <TextView revisionList={list()} />
            </>
          )}
        </Show>
      </div>
    </Modal>
  );
}
